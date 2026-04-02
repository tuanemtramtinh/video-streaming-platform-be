import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import { Config } from 'src/config/env.schema';
import {
  VIDEO_PROCESSING_QUEUE,
  VideoProcessingJobData,
} from 'src/shared/queues/video-processing.queue';
import { VideoProcessingProcessor } from 'src/worker/video-processing.processor';
import { WorkerModule } from 'src/worker/worker.module';

async function bootstrap() {
  const logger = new Logger('VideoWorker');

  logger.log('Bootstrapping worker application context...');
  const app = await NestFactory.createApplicationContext(WorkerModule);

  const configService = app.get(ConfigService<Config>);
  const processor = app.get(VideoProcessingProcessor);

  const connection = {
    host: configService.get<string>('REDIS_HOST'),
    port: Number(configService.get<string>('REDIS_PORT')),
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
    username: configService.get<string>('REDIS_USERNAME') || undefined,
    maxRetriesPerRequest: null,
  };

  const worker = new Worker<VideoProcessingJobData>(
    VIDEO_PROCESSING_QUEUE,
    async (job: Job<VideoProcessingJobData>) => {
      logger.log(`Processing job ${job.id} for lesson ${job.data.lessonId}...`);
      await processor.process(job.data);
      logger.log(`Job ${job.id} completed successfully`);
    },
    {
      connection,
      concurrency: 1,
      limiter: {
        max: 1,
        duration: 1000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
  );

  worker.on('completed', (job) => {
    logger.log(`Job ${job.id} completed for lesson ${job.data.lessonId}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(
      `Job ${job?.id} failed for lesson ${job?.data.lessonId}: ${err.message}`,
    );
  });

  worker.on('error', (err) => {
    logger.error(`Worker error: ${err.message}`);
  });

  logger.log('Video processing worker started and listening for jobs...');

  const shutdown = async () => {
    logger.log('Shutting down worker...');
    await worker.close();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown();
  });

  process.on('SIGINT', () => {
    void shutdown();
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});
