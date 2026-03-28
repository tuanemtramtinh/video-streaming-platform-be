import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { Config } from 'src/config/env.schema';

@Injectable()
export class S3Service {
  private s3: S3Client;

  constructor(private readonly configService: ConfigService<Config>) {
    this.s3 = new S3Client({
      region: configService.get('S3_REGION'),
      endpoint: configService.get('S3_ENDPOINT'),
      credentials: {
        accessKeyId: configService.get('S3_ACCESS_KEY')!,
        secretAccessKey: configService.get('S3_SECRET_KEY')!,
      },
      forcePathStyle: true,
    });
  }

  get bucketName(): string {
    return this.configService.get('S3_BUCKET_NAME')!;
  }

  get endpoint(): string {
    return this.configService.get('S3_ENDPOINT')!;
  }

  buildUrl(key: string): string {
    return `${this.endpoint}/${this.bucketName}/${key}`;
  }

  async deleteFile(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3.send(command);

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'thumbnails') {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files allowed');
    }

    const fileExtension = file.originalname.split('.').pop();
    const key = `${folder}/${randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3.send(command);

    return {
      key,
      url: this.buildUrl(key),
    };
  }

  async downloadToFile(key: string, destPath: string): Promise<void> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3.send(command);

    if (!response.Body) {
      throw new Error(`Empty response body for key: ${key}`);
    }

    await pipeline(response.Body as Readable, createWriteStream(destPath));
  }

  async uploadFromPath(
    filePath: string,
    key: string,
    contentType: string,
  ): Promise<{ key: string; url: string }> {
    const body = await readFile(filePath);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await this.s3.send(command);

    return {
      key,
      url: this.buildUrl(key),
    };
  }

}
