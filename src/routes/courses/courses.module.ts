import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CoursesRepository } from 'src/routes/courses/courses.repo';
import { UserRepository } from 'src/routes/users/user.repo';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, CoursesRepository, UserRepository],
})
export class CoursesModule {}