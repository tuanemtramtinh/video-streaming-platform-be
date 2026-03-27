import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { Config } from 'src/config/env.schema';
import { LessonsRepository } from 'src/routes/lessons/lessons.repo';
import { VideoProcessingJobData } from 'src/shared/queues/video-processing.queue';
import { S3Service } from 'src/shared/services/s3.service';

interface VideoStreamInfo {
  width: number;
  height: number;
  hasAudio: boolean;
}

interface HlsRendition {
  height: number;
  videoBitrate: string;
  maxrate: string;
  bufsize: string;
  audioBitrate: string;
}

const HLS_RENDITIONS: HlsRendition[] = [
  {
    height: 360,
    videoBitrate: '800k',
    maxrate: '856k',
    bufsize: '1200k',
    audioBitrate: '96k',
  },
  {
    height: 480,
    videoBitrate: '1400k',
    maxrate: '1498k',
    bufsize: '2100k',
    audioBitrate: '128k',
  },
  {
    height: 720,
    videoBitrate: '2800k',
    maxrate: '2996k',
    bufsize: '4200k',
    audioBitrate: '192k',
  },
  {
    height: 1080,
    videoBitrate: '5000k',
    maxrate: '5350k',
    bufsize: '8000k',
    audioBitrate: '192k',
  },
];

@Injectable()
export class VideoProcessingProcessor {
  private readonly logger = new Logger(VideoProcessingProcessor.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly lessonsRepository: LessonsRepository,
    private readonly configService: ConfigService<Config>,
  ) {}

  async process(jobData: VideoProcessingJobData): Promise<void> {
    const { lessonId, videoKey } = jobData;
    const tmpDir = await mkdtemp(join(tmpdir(), `hls-${lessonId}-`));
    const inputPath = join(tmpDir, `input${extname(videoKey) || '.mp4'}`);
    const outputDir = join(tmpDir, 'output');

    try {
      this.logger.log(`[Lesson ${lessonId}] Starting video processing`);

      await mkdir(outputDir, { recursive: true });

      this.logger.log(`[Lesson ${lessonId}] Downloading video from S3...`);
      await this.s3Service.downloadToFile(videoKey, inputPath);

      const fileInfo = await stat(inputPath);
      this.logger.log(
        `[Lesson ${lessonId}] Downloaded ${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`,
      );

      this.logger.log(`[Lesson ${lessonId}] Probing video info...`);
      const videoInfo = await this.probeVideo(inputPath);
      this.logger.log(
        `[Lesson ${lessonId}] Video: ${videoInfo.width}x${videoInfo.height}, audio: ${videoInfo.hasAudio}`,
      );

      const renditions = this.selectRenditions(videoInfo);
      this.logger.log(
        `[Lesson ${lessonId}] Selected renditions: ${renditions.map((r) => `${r.height}p`).join(', ')}`,
      );

      this.logger.log(`[Lesson ${lessonId}] Encoding to HLS...`);
      await this.encodeToHls(inputPath, outputDir, renditions, videoInfo);

      this.logger.log(`[Lesson ${lessonId}] Uploading HLS files to S3...`);
      const hlsPrefix = `videos/hls/${lessonId}`;
      await this.uploadHlsFiles(outputDir, hlsPrefix);

      const masterPlaylistUrl = this.s3Service.buildUrl(
        `${hlsPrefix}/master.m3u8`,
      );

      this.logger.log(`[Lesson ${lessonId}] Updating lesson record...`);
      await this.lessonsRepository.updateContentUrlAndVideoStatus(
        lessonId,
        masterPlaylistUrl,
        'ready',
      );

      this.logger.log(
        `[Lesson ${lessonId}] Video processing completed successfully`,
      );
    } catch (error) {
      this.logger.error(
        `[Lesson ${lessonId}] Video processing failed: ${error}`,
      );
      await this.lessonsRepository
        .updateVideoStatus(lessonId, 'failed')
        .catch((err) =>
          this.logger.error(
            `[Lesson ${lessonId}] Failed to update status: ${err}`,
          ),
        );
      throw error;
    } finally {
      await rm(tmpDir, { recursive: true, force: true }).catch((err) =>
        this.logger.warn(
          `[Lesson ${lessonId}] Failed to clean up temp dir: ${err}`,
        ),
      );
    }
  }

  private probeVideo(inputPath: string): Promise<VideoStreamInfo> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_streams',
        inputPath,
      ];

      const proc = spawn('ffprobe', args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const parsed = JSON.parse(stdout);
          const videoStream = parsed.streams?.find(
            (s: { codec_type: string }) => s.codec_type === 'video',
          );
          const audioStream = parsed.streams?.find(
            (s: { codec_type: string }) => s.codec_type === 'audio',
          );

          if (!videoStream) {
            reject(new Error('No video stream found'));
            return;
          }

          resolve({
            width: parseInt(videoStream.width, 10),
            height: parseInt(videoStream.height, 10),
            hasAudio: !!audioStream,
          });
        } catch (err) {
          reject(new Error(`Failed to parse ffprobe output: ${err}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to start ffprobe: ${err.message}`));
      });
    });
  }

  private selectRenditions(videoInfo: VideoStreamInfo): HlsRendition[] {
    const applicable = HLS_RENDITIONS.filter(
      (r) => r.height <= videoInfo.height,
    );

    if (applicable.length === 0) {
      return [HLS_RENDITIONS[0]];
    }

    return applicable;
  }

  private encodeToHls(
    inputPath: string,
    outputDir: string,
    renditions: HlsRendition[],
    videoInfo: VideoStreamInfo,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args: string[] = ['-i', inputPath, '-preset', 'fast'];

      args.push('-g', '48', '-sc_threshold', '0', '-keyint_min', '48');

      const filterParts: string[] = [];
      const splitOutputs = renditions
        .map((_, i) => `[v${i}]`)
        .join('');

      filterParts.push(`[0:v]split=${renditions.length}${splitOutputs}`);

      renditions.forEach((r, i) => {
        filterParts.push(`[v${i}]scale=-2:${r.height}[v${i}out]`);
      });

      args.push('-filter_complex', filterParts.join(';'));

      renditions.forEach((r, i) => {
        args.push(`-map`, `[v${i}out]`);
        if (videoInfo.hasAudio) {
          args.push('-map', '0:a:0');
        }
      });

      renditions.forEach((r, i) => {
        args.push(`-c:v:${i}`, 'libx264');
        args.push(`-b:v:${i}`, r.videoBitrate);
        args.push(`-maxrate:v:${i}`, r.maxrate);
        args.push(`-bufsize:v:${i}`, r.bufsize);

        if (videoInfo.hasAudio) {
          args.push(`-c:a:${i}`, 'aac');
          args.push(`-b:a:${i}`, r.audioBitrate);
          args.push(`-ac:${i}`, '2');
        }
      });

      args.push('-f', 'hls');
      args.push('-hls_time', '6');
      args.push('-hls_playlist_type', 'vod');
      args.push('-hls_flags', 'independent_segments');
      args.push('-master_pl_name', 'master.m3u8');

      const varStreamMap = renditions
        .map((_, i) =>
          videoInfo.hasAudio ? `v:${i},a:${i}` : `v:${i}`,
        )
        .join(' ');
      args.push('-var_stream_map', varStreamMap);

      const segmentPattern = join(outputDir, 'v%v', 'segment_%03d.ts').replace(
        /\\/g,
        '/',
      );
      const playlistPattern = join(outputDir, 'v%v', 'index.m3u8').replace(
        /\\/g,
        '/',
      );
      args.push('-hls_segment_filename', segmentPattern);
      args.push(playlistPattern);

      renditions.forEach((_, i) => {
        mkdirSync(join(outputDir, `v${i}`), { recursive: true });
      });

      this.logger.debug(`FFmpeg args: ffmpeg ${args.join(' ')}`);

      const proc = spawn('ffmpeg', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stderr = '';

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
          return;
        }
        resolve();
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to start FFmpeg: ${err.message}`));
      });
    });
  }

  private async uploadHlsFiles(
    outputDir: string,
    s3Prefix: string,
  ): Promise<void> {
    const files = await this.collectFiles(outputDir);
    this.logger.log(`Uploading ${files.length} HLS files...`);

    const BATCH_SIZE = 5;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (filePath) => {
          const relativePath = filePath
            .replace(outputDir, '')
            .replace(/\\/g, '/');
          const s3Key = `${s3Prefix}${relativePath}`;
          const contentType = this.getContentType(filePath);
          await this.s3Service.uploadFromPath(filePath, s3Key, contentType);
        }),
      );
    }
  }

  private async collectFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await this.collectFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  private getContentType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const name = basename(filePath).toLowerCase();

    if (ext === '.m3u8' || name === 'master.m3u8') {
      return 'application/vnd.apple.mpegurl';
    }
    if (ext === '.ts') {
      return 'video/MP2T';
    }
    return 'application/octet-stream';
  }
}
