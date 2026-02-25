import { pagination } from 'prisma-extension-pagination';
import { UserRepository } from './../users/user.repo';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateCourseDTO } from './courses.dto';
import { CoursesRepository } from './courses.repo';
import { PaginationType } from 'src/shared/models/pagination.model';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly UserRepository: UserRepository,
  ) {}
  async create(courses: CreateCourseDTO) {
    const instructor = await this.UserRepository.findUserById(
      courses.instructorId,
    );

    if (!instructor) {
      throw new UnprocessableEntityException('Instructor is not exist');
    }
    if (!instructor.roles.some((role) => role.role.name === 'teacher')) {
      throw new UnprocessableEntityException('User is not a teacher');
    }
    const course = {
      title: courses.title,
      description: courses.description,
      thumbnailUrl: courses.thumbnailUrl,
      instructorId: courses.instructorId,
      categoryId: courses.categoryId,
      status: courses.status,
    };
    const newCourse = await this.coursesRepository.create(course);
    return newCourse;
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
  async getCourseById(id: number) {
    const course = await this.coursesRepository.getCourseById(id);

    if (!course) {
      throw new UnprocessableEntityException('Course is not exist');
    }
    return course;
  }
}
