import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LoginBodyDTO, RegisterBodyDTO } from 'src/routes/auth/auth.dto';
import { AuthRepository } from 'src/routes/auth/auth.repo';
import { UserRepository } from 'src/routes/users/user.repo';
import { isNotFoundError } from 'src/shared/helper';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { TokenService } from 'src/shared/services/token.service';
import { RoleType } from 'src/shared/types/role.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
    private readonly hasingService: HashingService,
    private readonly tokenService: TokenService,
  ) {}

  async register(req: RegisterBodyDTO) {
    const existingUser = await this.userRepository.findUserByEmail(req.email);

    if (req.password !== req.confirmPassword) {
      throw new ConflictException('Mật khẩu không trùng khớp');
    }

    if (existingUser) {
      throw new ConflictException('Tài khoản đã tồn tại');
    }

    const user = {
      firstName: req.firstName,
      lastName: req.lastName,
      email: req.email,
      password: await this.hasingService.hash(req.password),
    };

    const newUser = await this.authRepository.create(user);

    await this.authRepository.assignRole(newUser.id, RoleType.Student);
    await this.authRepository.assignRole(newUser.id, RoleType.Teacher);

    return newUser;
  }

  async login(req: LoginBodyDTO) {
    const user = await this.userRepository.findUserByEmail(req.email, true);

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    const isPasswordMatch = await this.hasingService.compare(
      req.password,
      user.password,
    );

    if (!isPasswordMatch) {
      throw new UnprocessableEntityException('Mật khẩu không chính xác');
    }

    const userWithoutPassword = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map((role) => role.role.name),
    };

    const tokens = await this.generateTokens({ userId: user.id });

    return { user: userWithoutPassword, ...tokens };
  }

  async generateTokens(payload: { userId: number }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(payload),
      this.tokenService.signRefreshToken(payload),
    ]);

    const decodedRefreshToken =
      await this.tokenService.verifyRefreshToken(refreshToken);

    await this.prismaService.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.userId,
        expiresAt: new Date(decodedRefreshToken.exp * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      //1. Kiểm tra refreshToken có hợp hay không
      const { userId } =
        await this.tokenService.verifyRefreshToken(refreshToken);

      //2. Kiểm tra refreshToken có tồn tại trong Database không
      await this.prismaService.refreshToken.findUniqueOrThrow({
        where: {
          token: refreshToken,
        },
      });

      //3. Xoá refreshToken cũ
      await this.prismaService.refreshToken.delete({
        where: {
          token: refreshToken,
        },
      });

      //4. Tạo mới accesToken và refreshToken
      return await this.generateTokens({ userId });
    } catch (error) {
      // Trường hợp đã refresh token rồi, hãy thông báo cho user biết
      // refresh token của họ đã bị đánh cắp
      if (isNotFoundError(error)) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      throw new UnauthorizedException();
    }
  }

  async logout(refreshToken: string) {
    try {
      //1. Kiểm tra refreshToken có hợp hay không
      await this.tokenService.verifyRefreshToken(refreshToken);

      //2. Xoá refreshToken
      await this.prismaService.refreshToken.delete({
        where: {
          token: refreshToken,
        },
      });

      return { message: 'Logout successfuly' };
    } catch (error) {
      // Trường hợp đã refresh token rồi, hãy thông báo cho user biết
      // refresh token của họ đã bị đánh cắp
      if (isNotFoundError(error)) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      throw new UnauthorizedException();
    }
  }
}
