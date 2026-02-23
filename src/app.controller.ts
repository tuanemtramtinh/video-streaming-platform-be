import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from 'src/shared/services/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('seed')
  async seed() {
    await this.prismaService.role.createMany({
      data: [{ name: 'teacher' }, { name: 'admin' }, { name: 'student' }],
    });

    return 'Init Seed Successfully';
  }
}
