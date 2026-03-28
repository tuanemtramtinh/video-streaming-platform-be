import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { Config } from 'src/config/env.schema';

export const VIDEO_PROCESSING_QUEUE = 'video-processing';

export interface VideoProcessingJobData {
  lessonId: number;
  videoKey: string;
}

@Injectable()
export class VideoProcessingQueueService implements OnModuleDestroy {
  private queue: Queue<VideoProcessingJobData>;

  constructor(private readonly configService: ConfigService<Config>) {
    this.queue = new Queue(VIDEO_PROCESSING_QUEUE, {
      connection: {
        host: this.configService.get('REDIS_HOST'),
        port: this.configService.get('REDIS_PORT'),
        password: this.configService.get('REDIS_PASSWORD') || undefined,
        maxRetriesPerRequest: null,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60_000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    });
  }

  async addVideoProcessingJob(data: VideoProcessingJobData) {
    return this.queue.add('process-hls', data, {
      jobId: `lesson-${data.lessonId}-${Date.now()}`,
    });
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}
