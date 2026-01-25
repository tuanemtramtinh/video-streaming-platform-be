import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/routes/auth/auth.service';
import { Config } from 'src/config/env.schema';
import { PrismaService } from 'src/shared/services/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<Config>,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  hello() {
    return this.configService.get('ACCESS_TOKEN_EXPIRES_IN', { infer: true });
  }
}
