import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from 'src/routes/auth/auth.repo';
import { UserRepository } from 'src/routes/users/user.repo';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, UserRepository],
  exports: [AuthRepository, UserRepository],
})
export class AuthModule {}
