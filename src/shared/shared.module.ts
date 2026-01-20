import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HashingService } from 'src/shared/services/hashing.service';

const sharedServices = [HashingService];

@Global()
@Module({
  imports: [JwtModule],
  providers: sharedServices,
  exports: sharedServices,
})
export class SharedModule {}
