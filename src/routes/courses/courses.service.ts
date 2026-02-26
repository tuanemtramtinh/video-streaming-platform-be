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

  async getCourses(pagination: PaginationType) {
    const { page, limit } = pagination;
    const { data, meta } = await this.coursesRepository.getAllCourses(
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

  async getCourseById(courseId: number) {
    const course = await this.coursesRepository.findById(courseId);

    if (!course) {
      throw new NotFoundException('Course is not found');
    }

    return course;
  }

  async update(courseId: number, req: UpdateCourseBodyDTO, userId: number) {
    const currentCourse = await this.coursesRepository.findById(courseId);

    if (!currentCourse) {
      throw new NotFoundException('Course is not found');
    }

    if (currentCourse.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this course',
      );
    }

    return this.coursesRepository.updateById(courseId, req);
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

    console.log(key);

    await this.s3Service.deleteFile(key);

    await this.coursesRepository.deleteById(courseId);

    return {
      message: 'Course deleted successfully',
    };
  }
}
