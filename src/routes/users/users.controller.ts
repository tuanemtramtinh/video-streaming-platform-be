import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ZodSerializerDto } from 'nestjs-zod';
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import {
  UpdateProfileBodyDTO,
  UpdateProfileResDTO,
  UserProfileResDTO,
} from 'src/routes/users/users.dto';
import { UsersService } from './users.service';

type RequestWithUser = Request & {
  [REQUEST_USER_KEY]: { id: number };
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  @HttpCode(200)
  @ZodSerializerDto(UserProfileResDTO)
  getMyProfile(@Req() request: RequestWithUser) {
    return this.usersService.getMyProfile(request[REQUEST_USER_KEY].id);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  @HttpCode(200)
  @ZodSerializerDto(UpdateProfileResDTO)
  updateMyProfile(
    @Req() request: RequestWithUser,
    @Body() body: UpdateProfileBodyDTO,
  ) {
    return this.usersService.updateMyProfile(
      request[REQUEST_USER_KEY].id,
      body,
    );
  }
}
