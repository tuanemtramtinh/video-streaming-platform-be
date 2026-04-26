import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/routes/users/user.repo';
import type { UpdateProfileBodyType } from 'src/routes/users/users.model';
import type { UserType } from 'src/routes/auth/auth.model';

@Injectable()
export class UsersService {
    constructor(private readonly userRepository: UserRepository) { }

    async getMyProfile(userId: number) {
        const user = await this.userRepository.findUserById(userId);

        if (!user) {
            throw new NotFoundException('User is not exist');
        }

        return this.toUserProfile(user);
    }

    async updateMyProfile(userId: number, body: UpdateProfileBodyType) {
        const existingUser = await this.userRepository.findUserById(userId);

        if (!existingUser) {
            throw new NotFoundException('User is not exist');
        }

        const updatedUser = await this.userRepository.updateProfileById(userId, body);

        return this.toUserProfile(updatedUser);
    }

    private toUserProfile(user: Omit<UserType, 'password'>) {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            roles: user.roles.map((role) => role.role.name),
        };
    }
}
