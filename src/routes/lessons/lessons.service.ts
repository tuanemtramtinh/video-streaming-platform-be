import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config/env.schema';
import { LessonsRepository } from 'src/routes/lessons/lessons.repo';
import {
  CreateLessonDTO,
  UpdateLessonBodyDTO,
} from 'src/routes/lessons/lessons.dto';
import { LessonPaginationQueryType } from 'src/routes/lessons/lessons.model';
import { VideoProcessingQueueService } from 'src/shared/queues/video-processing.queue';
import { randomUUID } from 'node:crypto';
import { S3Service } from 'src/shared/services/s3.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  S3Client,
} from '@aws-sdk/client-s3';

@Injectable()
export class LessonsService {
  constructor(
    private readonly lessonsRepository: LessonsRepository,
    private readonly videoProcessingQueue: VideoProcessingQueueService,
    private readonly configService: ConfigService<Config>,
    private readonly s3Service: S3Service,
  ) {}

  async create(req: CreateLessonDTO, userId: number) {
    const section = await this.lessonsRepository.findSectionById(req.sectionId);

    if (!section) {
      throw new NotFoundException('Section is not found');
    }

    if (section.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to create lesson in this section',
      );
    }

    return this.lessonsRepository.create(req);
  }

  async getLessons(pagination: LessonPaginationQueryType) {
    const { page, limit, sectionId } = pagination;
    const { data, meta } = await this.lessonsRepository.getAllLessons(
      page,
      limit,
      sectionId,
    );
    const lastPage = Math.ceil(meta.total / limit);

    return {
      data,
      meta: {
        ...meta,
        lastPage,
        hasNextPage: page < lastPage,
        hasPrevPage: page > 1,
      },
    };
  }

  async getLessonById(lessonId: number) {
    const lesson = await this.lessonsRepository.findById(lessonId);

    if (!lesson) {
      throw new NotFoundException('Lesson is not found');
    }

    return lesson;
  }

  async update(lessonId: number, req: UpdateLessonBodyDTO, userId: number) {
    const currentLesson = await this.lessonsRepository.findById(lessonId);

    if (!currentLesson) {
      throw new NotFoundException('Lesson is not found');
    }

    if (currentLesson.section.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this lesson',
      );
    }

    if (req.sectionId) {
      const newSection = await this.lessonsRepository.findSectionById(
        req.sectionId,
      );

      if (!newSection) {
        throw new NotFoundException('Section is not found');
      }

      if (newSection.course.instructorId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to move lesson to this section',
        );
      }
    }

    return this.lessonsRepository.updateById(lessonId, req);
  }

  async delete(lessonId: number, userId: number) {
    const currentLesson = await this.lessonsRepository.findById(lessonId);

    if (!currentLesson) {
      throw new NotFoundException('Lesson is not found');
    }

    if (currentLesson.section.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this lesson',
      );
    }

    await this.lessonsRepository.deleteById(lessonId);

    return {
      message: 'Lesson deleted successfully',
    };
  }

  async processVideo(lessonId: number, userId: number, _unused?: unknown) {
    const lesson = await this.lessonsRepository.findById(lessonId);

    if (!lesson) {
      throw new NotFoundException('Lesson is not found');
    }

    if (lesson.section.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to process video for this lesson',
      );
    }

    if (lesson.videoStatus === 'processing') {
      throw new BadRequestException(
        'Video is already being processed for this lesson',
      );
    }

    await this.lessonsRepository.updateVideoStatus(lessonId, 'processing');

    const videoKey = this.extractVideoKeyFromContentUrl(lesson.contentUrl);

    await this.videoProcessingQueue.addVideoProcessingJob({
      lessonId,
      videoKey,
    });

    return {
      message: 'Video processing has been queued',
      lessonId,
      videoStatus: 'processing' as const,
    };
  }

  private extractVideoKeyFromContentUrl(contentUrl: string): string {
    if (!contentUrl) {
      throw new BadRequestException('Lesson contentUrl is empty');
    }

    const bucketName = this.configService.get('S3_BUCKET_NAME');

    try {
      const parsedUrl = new URL(contentUrl);
      let key = parsedUrl.pathname.replace(/^\/+/, '');

      if (bucketName && key.startsWith(`${bucketName}/`)) {
        key = key.slice(bucketName.length + 1);
      }

      if (!key) {
        throw new BadRequestException(
          'Cannot extract video key from contentUrl',
        );
      }

      return key;
    } catch {
      // Fallback: allow raw key in contentUrl field for non-URL values.
      return contentUrl.replace(/^\/+/, '');
    }
  }

  async startMultipartUpload(
    lessonId: number,
    userId: number,
    fileName: string,
    fileType: string,
    totalParts: number,
  ) {
    const lesson = await this.lessonsRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson is not found');
    }
    if (lesson.section.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to upload video for this lesson',
      );
    }

    const bucketName = this.configService.get('S3_BUCKET_NAME');
    const fileExtension = fileName.split('.').pop();
    const videoKey = `videos/raw/${Date.now()}-${randomUUID()}.${fileExtension}`;

    const createCommand = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: videoKey,
      ContentType: fileType,
    });
    const { UploadId } = await (this.s3Service as any).s3.send(createCommand);
    const tempS3Client = new S3Client({
      region: this.configService.get('S3_REGION'),
      endpoint: this.configService.get('S3_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY')!,
        secretAccessKey: this.configService.get('S3_SECRET_KEY')!,
      },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
    } as any);

    const presignedUrls: { partNumber: number; url: string }[] = [];

    for (let i = 1; i <= totalParts; i++) {
      const partCommand = new UploadPartCommand({
        Bucket: bucketName,
        Key: videoKey,
        UploadId: UploadId,
        PartNumber: i,
      });

      const url = await getSignedUrl(tempS3Client, partCommand, {
        expiresIn: 3600,
      });

      presignedUrls.push({ partNumber: i, url });
    }

    return {
      uploadId: UploadId,
      videoKey,
      urls: presignedUrls,
    };
  }

  async completeMultipartUpload(
    lessonId: number,
    userId: number,
    data: {
      uploadId: string;
      videoKey: string;
      parts: { ETag: string; PartNumber: number }[];
    },
  ) {
    const lesson = await this.lessonsRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson is not found');
    }
    if (lesson.section.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to complete upload for this lesson',
      );
    }

    const bucketName = this.configService.get('S3_BUCKET_NAME');
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: data.videoKey,
      UploadId: data.uploadId,
      MultipartUpload: {
        Parts: data.parts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
    });

    await (this.s3Service as any).s3.send(completeCommand);
    const videoUrl = this.s3Service.buildUrl(data.videoKey);
    await this.lessonsRepository.updateContentUrlAndVideoStatus(
      lessonId,
      videoUrl,
      'pending',
    );

    return {
      message: 'Video uploaded successfully. Ready for processing.',
      lessonId,
      videoStatus: 'pending' as const,
    };
  }
}
