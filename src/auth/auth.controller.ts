import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';
import { ConfigSchema } from 'src/config/env.schema';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<ConfigSchema>,
  ) {}

  @Get()
  hello() {
    return this.configService.get('ACCESS_TOKEN_EXPIRES_IN', { infer: true });
  }
}
