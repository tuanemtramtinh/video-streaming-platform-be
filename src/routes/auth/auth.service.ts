import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterBodyDTO } from 'src/routes/auth/auth.dto';
import { AuthRepository } from 'src/routes/auth/auth.repo';
import { UserRepository } from 'src/routes/users/user.repo';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
    private readonly hasingService: HashingService,
  ) {}

  async register(req: RegisterBodyDTO) {
    const existingUser = await this.userRepository.findUserByEmail(req.email);

    if (existingUser) {
      throw new ConflictException('Email already exist');
    }

    const user = {
      firstName: req.firstName,
      lastName: req.lastName,
      email: req.email,
      password: await this.hasingService.hash(req.password),
    };

    return this.authRepository.create(user);
  }
}
