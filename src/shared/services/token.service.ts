import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigSchema } from 'src/config/env.schema';
import { TokenPayload } from 'src/shared/types/jwt.type';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<ConfigSchema>,
  ) {}

  signAccessToken(payload: { userId: number }): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('ACCESS_TOKEN_SECRET', { infer: true }),
      expiresIn: this.configService.get('ACCESS_TOKEN_SECRET', { infer: true }),
      algorithm: 'HS256',
    } as JwtSignOptions);
  }

  signRefreshToken(payload: { userId: number }): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET', { infer: true }),
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN', {
        infer: true,
      }),
      algorithm: 'HS256',
    } as JwtSignOptions);
  }

  verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get('ACCESS_TOKEN_SECRET', { infer: true }),
    });
  }

  verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET', { infer: true }),
    });
  }
}
