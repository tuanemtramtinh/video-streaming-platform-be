import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserRepository } from 'src/routes/users/user.repo';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { S3Service } from 'src/shared/services/s3.service';
import { TokenService } from 'src/shared/services/token.service';

const sharedServices = [
  HashingService,
  PrismaService,
  TokenService,
  S3Service,
  AuthGuard,
];

@Global()
@Module({
  imports: [JwtModule],
  providers: [...sharedServices, UserRepository],
  exports: sharedServices,
})
export class SharedModule {}
