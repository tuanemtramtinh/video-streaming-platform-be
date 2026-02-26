import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
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

  async deleteFile(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.configService.get('S3_BUCKET_NAME'),
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
      Bucket: this.configService.get('S3_BUCKET_NAME'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3.send(command);

    return {
      key,
      url: `${this.configService.get('S3_ENDPOINT')}/${this.configService.get('S3_BUCKET_NAME')}/${key}`,
    };
  }
}
