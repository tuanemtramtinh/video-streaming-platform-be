import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CreateLessonDTO,
  CreateLessonResDTO,
  DeleteLessonResDTO,
  LessonResDTO,
  LessonWithPaginationDTO,
  ProcessVideoResDTO,
  UpdateLessonBodyDTO,
} from 'src/routes/lessons/lessons.dto';
import { LessonsService } from 'src/routes/lessons/lessons.service';
import { LessonPaginationQuerySchema } from 'src/routes/lessons/lessons.model';
import type { LessonPaginationQueryType } from 'src/routes/lessons/lessons.model';
import { Request } from 'express';
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { ZodSerializerDto } from 'nestjs-zod';

type RequestWithUser = Request & {
  [REQUEST_USER_KEY]: {
    id: number;
  };
};

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(201)
  @ZodSerializerDto(CreateLessonResDTO)
  create(@Body() req: CreateLessonDTO, @Req() request: RequestWithUser) {
    return this.lessonsService.create(req, request[REQUEST_USER_KEY].id);
  }

  @Get()
  @HttpCode(200)
  @ZodSerializerDto(LessonWithPaginationDTO)
  getLessons(@Query() query: LessonPaginationQueryType) {
    const validatedPagination = LessonPaginationQuerySchema.parse(query);
    return this.lessonsService.getLessons(validatedPagination);
  }

  @Get(':lessonId')
  @HttpCode(200)
  @ZodSerializerDto(LessonResDTO)
  getLessonById(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.lessonsService.getLessonById(lessonId);
  }

  @UseGuards(AuthGuard)
  @Patch(':lessonId')
  @HttpCode(200)
  @ZodSerializerDto(LessonResDTO)
  update(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() req: UpdateLessonBodyDTO,
    @Req() request: RequestWithUser,
  ) {
    return this.lessonsService.update(
      lessonId,
      req,
      request[REQUEST_USER_KEY].id,
    );
  }

  @UseGuards(AuthGuard)
  @Delete(':lessonId')
  @HttpCode(200)
  @ZodSerializerDto(DeleteLessonResDTO)
  delete(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Req() request: RequestWithUser,
  ) {
    return this.lessonsService.delete(lessonId, request[REQUEST_USER_KEY].id);
  }

  @UseGuards(AuthGuard)
  @Post(':lessonId/process-video')
  @HttpCode(200)
  @ZodSerializerDto(ProcessVideoResDTO)
  processVideo(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Req() request: RequestWithUser,
  ) {
    return this.lessonsService.processVideo(
      lessonId,
      request[REQUEST_USER_KEY].id,
    );
  }
}
