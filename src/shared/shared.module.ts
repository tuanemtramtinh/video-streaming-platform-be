import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';

const sharedServices = [HashingService, PrismaService];

@Global()
@Module({
  imports: [JwtModule],
  providers: sharedServices,
  exports: sharedServices,
})
export class SharedModule {}
