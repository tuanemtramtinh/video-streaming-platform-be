import { Injectable } from '@nestjs/common';
import { CreateCourseType, CourseType } from 'src/routes/courses/courses.model';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class CoursesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    courses: CreateCourseType,
  ): Promise<Omit<CourseType, 'id' | 'createdAt' | 'updatedAt'>> {
    return this.prismaService.course.create({
      data: {
        ...courses,
        thumbnailUrl: courses.thumbnailUrl ?? '',
      },
      omit: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async getAllCourses(page: number = 1, limit: number = 10) {
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaService.course.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.course.count(),
    ]);

    return { data, meta: { total, page: safePage } };
  }
  async getCourseById(id: number) {
    return this.prismaService.course.findUnique({
      where: {
        id: id,
      },
    });
  }
}
