import { Injectable } from '@nestjs/common';
import { UserType } from 'src/routes/auth/auth.model';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByEmail(
    email: string,
  ): Promise<Omit<UserType, 'password'> | null> {
    return await this.prismaService.user.findUnique({
      where: { email: email },
      omit: {
        password: true,
      },
    });
  }
}
