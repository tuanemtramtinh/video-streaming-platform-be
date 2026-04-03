import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { ResourcesRepo } from './resources.repo';

@Module({
  controllers: [ResourcesController],
  providers: [ResourcesService, ResourcesRepo]
})
export class ResourcesModule {}
