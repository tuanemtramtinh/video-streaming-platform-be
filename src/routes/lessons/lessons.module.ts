import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { LessonsRepository } from 'src/routes/lessons/lessons.repo';
import { UserRepository } from 'src/routes/users/user.repo';

@Module({
  controllers: [LessonsController],
  providers: [LessonsService, LessonsRepository, UserRepository],
})
export class LessonsModule { }
