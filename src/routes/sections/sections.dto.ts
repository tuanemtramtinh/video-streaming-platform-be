import { createZodDto } from 'nestjs-zod';
import {
  DeleteSectionResSchema,
  CreateSectionResSchema,
  CreateSectionSchema,
  SectionWithPaginationSchema,
  SectionWithRelationSchema,
  UpdateSectionSchema,
} from './sections.model';

export class CreateSectionDTO extends createZodDto(CreateSectionSchema) {}
export class CreateSectionResDTO extends createZodDto(CreateSectionResSchema) {}
export class SectionResDTO extends createZodDto(SectionWithRelationSchema) {}
export class SectionWithRelationDTO extends createZodDto(
  SectionWithRelationSchema,
) {}
export class SectionWithPaginationDTO extends createZodDto(
  SectionWithPaginationSchema,
) {}
export class UpdateSectionBodyDTO extends createZodDto(UpdateSectionSchema) {}
export class DeleteSectionResDTO extends createZodDto(DeleteSectionResSchema) {}
