import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { S3Service } from 'src/shared/services/s3.service';
import { ResourcesRepo } from 'src/routes/resources/resources.repo';
import { PaginationType } from 'src/shared/models/pagination.model';
import { LessonsByResourceResType } from 'src/routes/resources/resources.model';
import { UpdateResourceDTO } from 'src/routes/resources/resources.dto';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly resourcesRepo: ResourcesRepo,
  ) {}

  async uploadResource(fileName: string, fileType: string) {
    const key = `resources/${randomUUID()}-${fileName}`;
    const url = await this.s3Service.getPresignedUploadUrl(key, fileType);
    return { url, key };
  }

  async createResource(body: {
    courseId: number;
    title: string;
    fileUrl: string;
    fileType: string;
    lessonIds?: number[];
  }) {
    const { lessonIds, ...resourceData } = body;
    const resource = await this.resourcesRepo.create(resourceData);

    if (lessonIds && lessonIds.length > 0) {
      for (const lessonId of lessonIds) {
        const lesson = await this.resourcesRepo.findLessonById(lessonId);
        if (!lesson) {
          throw new NotFoundException(`Lesson with id ${lessonId} not found`);
        }
        const existing = await this.resourcesRepo.findLessonResource(
          resource.id,
          lessonId,
        );
        if (!existing) {
          await this.resourcesRepo.linkLessonToResource(resource.id, lessonId);
        }
      }
    }

    return resource;
  }

  async getAllResources(courseId: number, pagination: PaginationType) {
    const { page, limit } = pagination;
    return this.resourcesRepo.findAllByCourseId(courseId, page, limit);
  }

  async getLessonsByResourceId(
    resourceId: number,
  ): Promise<LessonsByResourceResType> {
    const resource = await this.resourcesRepo.findById(resourceId);
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    return this.resourcesRepo.findLessonsByResourceId(resourceId);
  }

  async getAllResourcesByLessonId(lessonId: number) {
    const lesson = await this.resourcesRepo.findLessonById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    return this.resourcesRepo.findResourcesByLessonId(lessonId);
  }

  async updateResource(resourceId: number, body: UpdateResourceDTO) {
    const resource = await this.resourcesRepo.findById(resourceId);
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    if (body.title) {
      await this.resourcesRepo.updateById(resourceId, { title: body.title });
    }

    if (body.lessonIds) {
      const currentLinks =
        await this.resourcesRepo.findLessonsByResourceId(resourceId);
      const currentLessonIds = currentLinks.map((l) => l.lessonId);

      const toDelete = currentLessonIds.filter(
        (id) => !body.lessonIds!.includes(id),
      );
      const toAdd = body.lessonIds.filter(
        (id) => !currentLessonIds.includes(id),
      );

      for (const lessonId of toDelete) {
        await this.resourcesRepo.deleteLessonResource(resourceId, lessonId);
      }

      for (const lessonId of toAdd) {
        const lesson = await this.resourcesRepo.findLessonById(lessonId);
        if (!lesson) {
          throw new NotFoundException(`Lesson with id ${lessonId} not found`);
        }
        await this.resourcesRepo.linkLessonToResource(resourceId, lessonId);
      }
    }

    return { message: 'Resource updated successfully' };
  }
}
