import { createZodDto } from 'nestjs-zod';
import {
  CreateLessonSchema,
  CreateLessonResSchema,
  DeleteLessonResSchema,
  LessonWithPaginationSchema,
  LessonWithRelationSchema,
  ProcessVideoResSchema,
  UpdateLessonBodySchema,
} from 'src/routes/lessons/lessons.model';

export class CreateLessonDTO extends createZodDto(CreateLessonSchema) {}

export class CreateLessonResDTO extends createZodDto(CreateLessonResSchema) {}

export class LessonResDTO extends createZodDto(LessonWithRelationSchema) {}

export class LessonWithPaginationDTO extends createZodDto(
  LessonWithPaginationSchema,
) {}

export class UpdateLessonBodyDTO extends createZodDto(UpdateLessonBodySchema) {}

export class DeleteLessonResDTO extends createZodDto(DeleteLessonResSchema) {}

export class ProcessVideoResDTO extends createZodDto(ProcessVideoResSchema) {}
