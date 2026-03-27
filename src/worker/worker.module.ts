import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from 'src/config/env.validate';
import { LessonsRepository } from 'src/routes/lessons/lessons.repo';
import { SharedModule } from 'src/shared/shared.module';
import { VideoProcessingProcessor } from 'src/worker/video-processing.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env'],
      ignoreEnvFile: false,
    }),
    SharedModule,
  ],
  providers: [LessonsRepository, VideoProcessingProcessor],
})
export class WorkerModule {}
