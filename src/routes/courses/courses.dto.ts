import { createZodDto } from 'nestjs-zod';
import { CreateCourseSchema } from './courses.model';

export class CreateCourseDTO extends createZodDto(CreateCourseSchema) {}
