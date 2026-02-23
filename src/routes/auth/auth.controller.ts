import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/routes/auth/auth.service';
import { Config } from 'src/config/env.schema';
import { RegisterBodyDTO } from 'src/routes/auth/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly authService: AuthService,
  ) {}

  @Get()
  hello() {
    return this.configService.get('ACCESS_TOKEN_EXPIRES_IN', { infer: true });
  }

  @Post('/register')
  register(@Body() req: RegisterBodyDTO) {
    return this.authService.register(req);
  }

  @Post('/login')
  login() {}
}
