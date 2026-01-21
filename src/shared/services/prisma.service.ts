import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { ConfigSchema } from 'src/config/env.schema';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private readonly configService: ConfigService<ConfigSchema>) {
    const connectionString = configService.get('DATABASE_URL', { infer: true });
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
    console.log('Ket noi db thanh cong');
  }
}
