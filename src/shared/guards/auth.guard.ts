import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../services/token.service';
import { UserRepository } from 'src/routes/users/user.repo';
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = await this.tokenService.verifyAccessToken(token);

      const user = await this.userRepository.findUserById(decodedToken.userId);

      if (!user) {
        throw new UnauthorizedException('User is not exist');
      }

      request[REQUEST_USER_KEY] = user;
      return true;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token expired');
      }

      throw new UnauthorizedException('Invalid access token');
    }
  }
}
