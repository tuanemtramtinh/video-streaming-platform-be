import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Config } from 'src/config/env.schema';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private readonly configService: ConfigService<Config>) {
    const connectionString = configService.get('DATABASE_URL', { infer: true });
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }
}
