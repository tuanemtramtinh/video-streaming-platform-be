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

@Injectable()
export class LessonsService {
  constructor(
    private readonly lessonsRepository: LessonsRepository,
    private readonly videoProcessingQueue: VideoProcessingQueueService,
    private readonly configService: ConfigService<Config>,
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

  async processVideo(
    lessonId: number,
    userId: number,
    _unused?: unknown,
  ) {
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
        throw new BadRequestException('Cannot extract video key from contentUrl');
      }

      return key;
    } catch {
      // Fallback: allow raw key in contentUrl field for non-URL values.
      return contentUrl.replace(/^\/+/, '');
    }
  }
}
