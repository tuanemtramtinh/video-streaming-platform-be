import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/routes/auth/auth.service';
import { Config } from 'src/config/env.schema';
import {
  LoginBodyDTO,
  LoginResDTO,
  LogoutBodyDTO,
  RegisterBodyDTO,
} from 'src/routes/auth/auth.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import { RefreshTokenBodyDTO } from './auth.dto';

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
  @ZodSerializerDto(LoginResDTO)
  login(@Body() req: LoginBodyDTO) {
    return this.authService.login(req);
  }

  @Post('/refresh-token')
  refreshToken(@Body() req: RefreshTokenBodyDTO) {
    return this.authService.refreshToken(req.refreshToken);
  }

  @Post('/logout')
  logout(@Body() req: LogoutBodyDTO) {
    return this.authService.logout(req.refreshToken);
  }
}
