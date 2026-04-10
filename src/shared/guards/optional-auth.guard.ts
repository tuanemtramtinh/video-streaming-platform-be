import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from 'src/shared/services/token.service';
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = await this.tokenService.verifyAccessToken(token);
        request[REQUEST_USER_KEY] = { id: decoded.userId };
      } catch {
        // invalid/expired token → treat as unauthenticated
      }
    }

    return true;
  }
}
