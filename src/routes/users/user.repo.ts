import { Injectable } from '@nestjs/common';
import { UserType } from 'src/routes/auth/auth.model';
import { PrismaService } from 'src/shared/services/prisma.service';
import type { UpdateProfileBodyType } from 'src/routes/users/users.model';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) { }

  async findUserByEmail(
    email: string,
    includePassword: true,
  ): Promise<UserType | null>;
  async findUserByEmail(
    email: string,
    includePassword?: false,
  ): Promise<Omit<UserType, 'password'> | null>;
  async findUserByEmail(
    email: string,
    includePassword: boolean = false,
  ): Promise<Omit<UserType, 'password'> | null> {
    return await this.prismaService.user.findUnique({
      where: { email: email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      ...(includePassword
        ? {}
        : {
          omit: {
            password: true,
          },
        }),
    });
  }

  async findUserById(
    id: number,
    includePassword: true,
  ): Promise<UserType | null>;
  async findUserById(
    id: number,
    includePassword?: false,
  ): Promise<Omit<UserType, 'password'> | null>;
  async findUserById(
    id: number,
    includePassword: boolean = false,
  ): Promise<Omit<UserType, 'password'> | null> {
    return await this.prismaService.user.findUnique({
      where: { id: id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      ...(includePassword
        ? {}
        : {
          omit: {
            password: true,
          },
        }),
    });
  }

  async updateProfileById(
    id: number,
    data: UpdateProfileBodyType,
  ): Promise<Omit<UserType, 'password'>> {
    return this.prismaService.user.update({
      where: { id },
      data,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      omit: {
        password: true,
      },
    });
  }
}
