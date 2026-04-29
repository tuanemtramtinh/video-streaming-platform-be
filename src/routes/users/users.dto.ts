import { createZodDto } from 'nestjs-zod';
import {
  UpdateProfileBodySchema,
  UpdateProfileResSchema,
  UserProfileSchema,
} from 'src/routes/users/users.model';

export class UserProfileResDTO extends createZodDto(UserProfileSchema) {}

export class UpdateProfileBodyDTO extends createZodDto(
  UpdateProfileBodySchema,
) {}

export class UpdateProfileResDTO extends createZodDto(UpdateProfileResSchema) {}
