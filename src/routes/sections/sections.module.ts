import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';
import { CoursesModule } from '../courses/courses.module';
import { SharedModule } from 'src/shared/shared.module';
import { SectionsRepository } from './sections.repo';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CoursesModule, SharedModule, UsersModule],
  controllers: [SectionsController],
  providers: [SectionsService, SectionsRepository],
  exports: [SectionsService],
})
export class SectionsModule {}
