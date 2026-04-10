import { Injectable } from '@nestjs/common';
import {
  CreateCourseType,
  CourseType,
  UpdateCourseBodyType,
  CourseWithRelationType,
  StudentEnrollCourseRelationType,
  EnrollmentWithStudentType,
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

  async findById(courseId: number) {
    return this.prismaService.course.findUnique({
      where: { id: courseId },
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
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });
  }

  // async findDetailById(
  //   courseId: number,
  // ): Promise<CourseDetailWithSectionsAndLessonsType | null> {
  //   return this.prismaService.course.findUnique({
  //     where: {
  //       id: courseId,
  //     },
  //     include: {
  //       instructor: {
  //         select: {
  //           id: true,
  //           firstName: true,
  //           lastName: true,
  //           email: true,
  //         },
  //       },
  //       category: {
  //         select: {
  //           id: true,
  //           name: true,
  //         },
  //       },
  //       sections: {
  //         orderBy: { orderIndex: 'asc' },
  //         include: {
  //           lessons: {
  //             orderBy: { orderIndex: 'asc' },
  //           },
  //         },
  //       },
  //     },
  //   });
  // }

  async findByInstructorId(
    instructorId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaService.course.findMany({
        skip,
        take: limit,
        where: {
          instructorId,
        },
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
      this.prismaService.course.count({
        where: {
          instructorId,
        },
      }),
    ]);
    return { data, meta: { total, page: safePage } };
  }

  async searchByName(name: string, page: number = 1, limit: number = 10) {
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;

    const whereClause = {
      title: {
        contains: name,
        mode: 'insensitive' as const,
      },
    };

    const [data, total] = await Promise.all([
      this.prismaService.course.findMany({
        skip,
        take: limit,
        where: whereClause,
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
      this.prismaService.course.count({
        where: whereClause,
      }),
    ]);

    return { data, meta: { total, page: safePage } };
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

  async findEnrolledCourseIds(userId: number): Promise<number[]> {
    const enrollments = await this.prismaService.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    return enrollments.map((e) => e.courseId);
  }

  async findEnrolledCourses(userId: number, page: number, limit: number) {
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaService.course.findMany({
        skip,
        take: limit,
        where: { enrollments: { some: { userId } } },
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
          category: { select: { id: true, name: true } },
        },
      }),
      this.prismaService.course.count({
        where: { enrollments: { some: { userId } } },
      }),
    ]);

    return { data, meta: { total, page: safePage } };
  }

  async findEnrollmentsByCourse(
    courseId: number,
    search: string | undefined,
    page: number,
    limit: number,
    sortBy: 'enrolledAt' | 'name',
  ): Promise<{ data: EnrollmentWithStudentType[]; meta: { total: number; page: number } }> {
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;

    const whereClause = {
      courseId,
      ...(search
        ? {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
              ],
            },
          }
        : {}),
    };

    const orderBy =
      sortBy === 'name'
        ? [{ user: { firstName: 'asc' as const } }]
        : [{ enrolledAt: 'desc' as const }];

    const [data, total] = await Promise.all([
      this.prismaService.enrollment.findMany({
        skip,
        take: limit,
        where: whereClause,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prismaService.enrollment.count({ where: whereClause }),
    ]);

    return { data, meta: { total, page: safePage } };
  }

  async findEnrollment(courseId: number, userId: number) {
    return this.prismaService.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });
  }

  async enrollStudent(
    courseId: number,
    userId: number,
  ): Promise<StudentEnrollCourseRelationType> {
    return this.prismaService.enrollment.create({
      data: {
        courseId,
        userId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}
