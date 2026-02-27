import { createZodDto } from 'nestjs-zod';
import {
  CreateCourseSchema,
  CreateCourseResSchema,
  DeleteCourseResSchema,
  UpdateCourseBodySchema,
  CourseWithRelationSchema,
  CourseWithPaginationSchema,
} from 'src/routes/courses/courses.model';

export class CreateCourseDTO extends createZodDto(CreateCourseSchema) {}

export class CreateCourseResDTO extends createZodDto(CreateCourseResSchema) {}

export class CourseResDTO extends createZodDto(CourseWithRelationSchema) {}

export class CourseWithPaginationDTO extends createZodDto(
  CourseWithPaginationSchema,
) {}

export class UpdateCourseBodyDTO extends createZodDto(UpdateCourseBodySchema) {}

export class DeleteCourseResDTO extends createZodDto(DeleteCourseResSchema) {}
