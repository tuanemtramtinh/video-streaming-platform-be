import { Injectable } from '@nestjs/common';
import { RegisterBodyType, UserType } from 'src/routes/auth/auth.model';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(user: RegisterBodyType): Promise<Omit<UserType, 'password'>> {
    return this.prismaService.user.create({
      data: user,
      omit: {
        password: true,
      },
    });
  }
}
