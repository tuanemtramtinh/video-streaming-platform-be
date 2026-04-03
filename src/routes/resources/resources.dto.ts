import { createZodDto } from 'nestjs-zod';
import {
  CreateResourceResSchema,
  CreateResourceSchema,
  LessonsByResourceResSchema,
  UpdateResourceSchema,
  UploadResourceBodySchema,
  UploadResourceResSchema,
} from 'src/routes/resources/resources.model';

export class UploadResourceBodyDTO extends createZodDto(
  UploadResourceBodySchema,
) {}

export class UploadResourceResDTO extends createZodDto(
  UploadResourceResSchema,
) {}

export class CreateResourceDTO extends createZodDto(CreateResourceSchema) {}

export class CreateResourceResDTO extends createZodDto(
  CreateResourceResSchema,
) {}

export class LessonsByResourceResDTO extends createZodDto(
  LessonsByResourceResSchema,
) {}

export class UpdateResourceDTO extends createZodDto(UpdateResourceSchema) {}
