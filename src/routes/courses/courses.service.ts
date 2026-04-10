import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CreateCourseDTO,
  UpdateCourseBodyDTO,
} from 'src/routes/courses/courses.dto';
import {
  EnrollmentListQueryType,
  SearchCourseQueryType,
} from 'src/routes/courses/courses.model';
import { CoursesRepository } from 'src/routes/courses/courses.repo';
import { PaginationType } from 'src/shared/models/pagination.model';
import { UserRepository } from 'src/routes/users/user.repo';
import { S3Service } from 'src/shared/services/s3.service';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config/env.schema';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService<Config>,
  ) {}

  async create(
    file: Express.Multer.File,
    courses: CreateCourseDTO,
    userId: number,
  ) {
    const instructor = await this.userRepository.findUserById(userId);

    if (!instructor) {
      throw new UnprocessableEntityException('Instructor is not exist');
    }

    if (!instructor.roles.some((role) => role.role.name === 'teacher')) {
      throw new UnprocessableEntityException('User is not a teacher');
    }

    const res = await this.s3Service.uploadFile(file);

    return this.coursesRepository.create(courses, userId, res.url);
  }

  async getCourses(pagination: PaginationType, userId: number | null) {
    const { page, limit } = pagination;
    const { data, meta } = await this.coursesRepository.getAllCourses(
      page,
      limit,
    );

    const enrolledIds = userId
      ? await this.coursesRepository.findEnrolledCourseIds(userId)
      : [];
    const enrolledSet = new Set(enrolledIds);

    const lastPage = Math.ceil(meta.total / limit);
    return {
      data: data.map((course) => ({
        ...course,
        isEnrolled: enrolledSet.has(course.id),
      })),
      meta: {
        ...meta,
        lastPage,
        hasNextPage: page < lastPage,
        hasPrevPage: page > 1,
      },
    };
  }

  async getCourseById(courseId: number, userId: number | null) {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course is not found');
    }

    const enrollment = userId
      ? await this.coursesRepository.findEnrollment(courseId, userId)
      : null;

    return { ...course, isEnrolled: enrollment !== null };
  }

  // async getCourseDetailWithSectionsAndLessons(courseId: number) {
  //   const course = await this.coursesRepository.findDetailById(courseId);

  //   if (!course) {
  //     throw new NotFoundException('Course is not found');
  //   }

  //   return course;
  // }

  async searchCourses(query: SearchCourseQueryType) {
    const { page, limit, name } = query;
    const { data, meta } = await this.coursesRepository.searchByName(
      name,
      page,
      limit,
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

  async getCoursesByInstructorId(
    instructorId: number,
    pagination: PaginationType,
  ) {
    const instructor = await this.userRepository.findUserById(instructorId);

    if (!instructor) {
      throw new UnprocessableEntityException('Instructor is not exist');
    }
    if (!instructor.roles.some((role) => role.role.name === 'teacher')) {
      throw new UnprocessableEntityException('User is not a teacher');
    }

    const { page, limit } = pagination;
    const { data, meta } = await this.coursesRepository.findByInstructorId(
      instructorId,
      page,
      limit,
    );
    const lastPage = Math.ceil(meta.total / limit);

    return {
      data,
      meta: {
        total: meta.total,
        page: meta.page,
        lastPage,
        hasNextPage: meta.page < lastPage,
        hasPrevPage: meta.page > 1,
      },
    };
  }

  async getEnrolledCourses(userId: number, pagination: PaginationType) {
    const { page, limit } = pagination;
    const { data, meta } = await this.coursesRepository.findEnrolledCourses(
      userId,
      page,
      limit,
    );
    const lastPage = Math.ceil(meta.total / limit);

    return {
      data: data.map((course) => ({ ...course, isEnrolled: true as const })),
      meta: {
        ...meta,
        lastPage,
        hasNextPage: page < lastPage,
        hasPrevPage: page > 1,
      },
    };
  }

  async getEnrollmentsByCourse(
    courseId: number,
    query: EnrollmentListQueryType,
  ) {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course is not found');
    }

    const { page, limit, search, sortBy } = query;
    const { data, meta } = await this.coursesRepository.findEnrollmentsByCourse(
      courseId,
      search,
      page,
      limit,
      sortBy,
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

  async update(
    courseId: number,
    req: UpdateCourseBodyDTO,
    file: Express.Multer.File,
    userId: number,
  ) {
    const currentCourse = await this.coursesRepository.findById(courseId);

    if (!currentCourse) {
      throw new NotFoundException('Course is not found');
    }

    if (currentCourse.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this course',
      );
    }

    if (file) {
      const thumbnailUrl = new URL(currentCourse.thumbnailUrl);
      const path = thumbnailUrl.pathname;
      const key = path.replace(
        `/${this.configService.get('S3_BUCKET_NAME')}/`,
        '',
      );
      await this.s3Service.deleteFile(key);
      const { url } = await this.s3Service.uploadFile(file);
      req.thumbnailUrl = url;
    }

    const res = await this.coursesRepository.updateById(courseId, req);

    return res;
  }

  async delete(courseId: number, userId: number) {
    const currentCourse = await this.coursesRepository.findById(courseId);

    if (!currentCourse) {
      throw new NotFoundException('Course is not found');
    }

    if (currentCourse.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this course',
      );
    }

    const thumbnailUrl = new URL(currentCourse.thumbnailUrl);
    const path = thumbnailUrl.pathname;
    const key = path.replace(
      `/${this.configService.get('S3_BUCKET_NAME')}/`,
      '',
    );

    await this.s3Service.deleteFile(key);

    await this.coursesRepository.deleteById(courseId);

    return {
      message: 'Course deleted successfully',
    };
  }

  async studentEnrollCourse(courseId: number, userId: number) {
    const [course, student] = await Promise.all([
      this.coursesRepository.findById(courseId),
      this.userRepository.findUserById(userId),
    ]);

    if (!course) {
      throw new NotFoundException('Course is not found');
    }
    if (!student) {
      throw new NotFoundException('Student is not found');
    }

    const existingEnrollment = await this.coursesRepository.findEnrollment(
      courseId,
      userId,
    );
    if (existingEnrollment) {
      throw new UnprocessableEntityException(
        'Student already enrolled in this course',
      );
    }

    return this.coursesRepository.enrollStudent(courseId, userId);
  }
}
