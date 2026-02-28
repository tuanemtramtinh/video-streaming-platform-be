import { Injectable, NotFoundException } from '@nestjs/common';
import { RegisterBodyType, UserType } from 'src/routes/auth/auth.model';
import { PrismaService } from 'src/shared/services/prisma.service';
import { RoleTypeType } from 'src/shared/types/role.type';

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    user: Omit<RegisterBodyType, 'confirmPassword'>,
  ): Promise<Omit<UserType, 'password' | 'roles'>> {
    return this.prismaService.user.create({
      data: user,
      omit: {
        password: true,
      },
    });
  }

  async assignRole(userId: number, role: RoleTypeType) {
    const existRole = await this.prismaService.role.findUnique({
      where: {
        name: role,
      },
    });

    if (!existRole) {
      throw new NotFoundException('Role is not found');
    }

    return this.prismaService.userRole.create({
      data: {
        userId,
        roleId: existRole.id,
      },
    });
  }
}
