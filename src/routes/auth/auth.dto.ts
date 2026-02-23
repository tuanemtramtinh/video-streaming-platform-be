import { createZodDto } from 'nestjs-zod';
import { RegisterBodySchema } from 'src/routes/auth/auth.model';

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}
