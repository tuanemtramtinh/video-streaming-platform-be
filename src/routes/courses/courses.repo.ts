import { Injectable } from '@nestjs/common';
import {
  CreateCourseType,
  CourseType,
  UpdateCourseBodyType,
  CourseWithRelationType,
} from 'src/routes/courses/courses.model';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class CoursesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    courses: CreateCourseType,
    instructorId: number,
    url: string,
  ): Promise<Omit<CourseWithRelationType, 'id' | 'createdAt' | 'updatedAt'>> {
    return this.prismaService.course.create({
      data: {
        ...courses,
        instructorId,
        thumbnailUrl: url,
      },
      omit: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
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
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prismaService.course.count(),
    ]);

    return { data, meta: { total, page: safePage } };
  }

  async findById(courseId: number): Promise<CourseWithRelationType | null> {
    return this.prismaService.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateById(
    courseId: number,
    data: UpdateCourseBodyType,
  ): Promise<CourseWithRelationType> {
    return this.prismaService.course.update({
      where: {
        id: courseId,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      data,
    });
  }

  async deleteById(courseId: number): Promise<CourseType> {
    return this.prismaService.course.delete({
      where: {
        id: courseId,
      },
    });
  }
}
