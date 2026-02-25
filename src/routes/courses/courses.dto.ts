import { createZodDto } from 'nestjs-zod';
import {
    CourseSchema,
    DeleteCourseResSchema,
    UpdateCourseBodySchema,
} from 'src/routes/courses/courses.model';

export class CourseResDTO extends createZodDto(CourseSchema) { }

export class UpdateCourseBodyDTO extends createZodDto(UpdateCourseBodySchema) { }

export class DeleteCourseResDTO extends createZodDto(DeleteCourseResSchema) { }
