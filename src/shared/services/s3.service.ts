import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
  private presignClient: S3Client;

  constructor(private readonly configService: ConfigService<Config>) {
    const clientConfig = {
      region: configService.get<string>('S3_REGION'),
      endpoint: configService.get<string>('S3_ENDPOINT'),
      credentials: {
        accessKeyId: configService.get<string>('S3_ACCESS_KEY')!,
        secretAccessKey: configService.get<string>('S3_SECRET_KEY')!,
      },
      forcePathStyle: true,
    };
    this.s3 = new S3Client(clientConfig);
    this.presignClient = new S3Client({
      ...clientConfig,
      requestChecksumCalculation: 'WHEN_REQUIRED',
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

  async createMultipartUpload(
    key: string,
    contentType: string,
  ): Promise<string> {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    const { UploadId } = await this.s3.send(command);
    return UploadId!;
  }

  async signUploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
  ): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    return getSignedUrl(this.presignClient, command, { expiresIn: 3600 });
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.presignClient, command, { expiresIn });
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ): Promise<void> {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
    });
    await this.s3.send(command);
  }
}
