import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { LessonsByResourceResType } from 'src/routes/resources/resources.model';

@Injectable()
export class ResourcesRepo {
  constructor(private readonly prismaService: PrismaService) {}

  create(data: {
    courseId: number;
    title: string;
    fileUrl: string;
    fileType: string;
  }) {
    return this.prismaService.resource.create({ data });
  }

  findById(resourceId: number) {
    return this.prismaService.resource.findUnique({
      where: { id: resourceId },
    });
  }

  updateById(resourceId: number, data: { title?: string }) {
    return this.prismaService.resource.update({
      where: { id: resourceId },
      data,
    });
  }

  findLessonById(lessonId: number) {
    return this.prismaService.lesson.findUnique({ where: { id: lessonId } });
  }

  async findLessonsByResourceId(
    resourceId: number,
  ): Promise<LessonsByResourceResType> {
    const result = await this.prismaService.lessonResource.findMany({
      where: { resourceId },
      include: {
        lesson: true,
      },
    });
    return result;
  }

  async findResourcesByLessonId(lessonId: number) {
    const result = await this.prismaService.lessonResource.findMany({
      where: { lessonId },
      include: { resource: true },
    });
    return result.map((lr) => lr.resource);
  }

  findLessonResource(resourceId: number, lessonId: number) {
    return this.prismaService.lessonResource.findUnique({
      where: { lessonId_resourceId: { lessonId, resourceId } },
    });
  }

  deleteLessonResource(resourceId: number, lessonId: number) {
    return this.prismaService.lessonResource.delete({
      where: { lessonId_resourceId: { lessonId, resourceId } },
    });
  }

  linkLessonToResource(resourceId: number, lessonId: number) {
    return this.prismaService.lessonResource.create({
      data: { lessonId, resourceId },
    });
  }

  async findAllByCourseId(
    courseId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaService.resource.findMany({
        where: { courseId },
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prismaService.resource.count({ where: { courseId } }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page: safePage,
        lastPage,
        hasNextPage: safePage < lastPage,
        hasPrevPage: safePage > 1,
      },
    };
  }
}
