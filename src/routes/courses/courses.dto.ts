import { createZodDto } from 'nestjs-zod';
import {
    CreateCourseSchema,
    CreateCourseResSchema,
    CourseSchema,
    DeleteCourseResSchema,
    UpdateCourseBodySchema,
} from 'src/routes/courses/courses.model';

export class CreateCourseDTO extends createZodDto(CreateCourseSchema) { }

export class CreateCourseResDTO extends createZodDto(CreateCourseResSchema) { }

export class CourseResDTO extends createZodDto(CourseSchema) { }

export class UpdateCourseBodyDTO extends createZodDto(UpdateCourseBodySchema) { }

export class DeleteCourseResDTO extends createZodDto(DeleteCourseResSchema) { }
