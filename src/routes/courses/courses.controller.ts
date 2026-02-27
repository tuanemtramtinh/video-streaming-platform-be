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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  CreateCourseDTO,
  CreateCourseResDTO,
  CourseResDTO,
  DeleteCourseResDTO,
  UpdateCourseBodyDTO,
  CourseWithPaginationDTO,
} from 'src/routes/courses/courses.dto';
import { CoursesService } from 'src/routes/courses/courses.service';
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { Request } from 'express';
import {
  PaginationSchema,
  type PaginationInputType,
} from 'src/shared/models/pagination.model';
import { FileInterceptor } from '@nestjs/platform-express';

type RequestWithUser = Request & {
  [REQUEST_USER_KEY]: {
    id: number;
  };
};

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  @HttpCode(201)
  @ZodSerializerDto(CreateCourseResDTO)
  createCourses(
    @UploadedFile() file: Express.Multer.File,
    @Body() req: CreateCourseDTO,
    @Req() request: RequestWithUser,
  ) {
    // console.log(file);
    return this.coursesService.create(file, req, request[REQUEST_USER_KEY].id);
  }

  @Get()
  @HttpCode(200)
  @ZodSerializerDto(CourseWithPaginationDTO)
  getCourses(@Query() query: PaginationInputType) {
    const validatedPagination = PaginationSchema.parse(query);
    return this.coursesService.getCourses(validatedPagination);
  }

  @Get(':courseId')
  @HttpCode(200)
  @ZodSerializerDto(CourseResDTO)
  getCourseById(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursesService.getCourseById(courseId);
  }

  @Get('instructor/:instructorId')
  @HttpCode(200)
  @ZodSerializerDto(CourseWithPaginationDTO)
  getCoursesByInstructorId(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Query() query: PaginationInputType,
  ) {
    const validatedPagination = PaginationSchema.parse(query);
    return this.coursesService.getCoursesByInstructorId(
      instructorId,
      validatedPagination,
    );
  }

  @UseGuards(AuthGuard)
  @Patch(':courseId')
  @UseInterceptors(FileInterceptor('thumbnail'))
  @HttpCode(200)
  @ZodSerializerDto(CourseResDTO)
  update(
    @Param('courseId', ParseIntPipe) courseId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() req: UpdateCourseBodyDTO,
    @Req() request: RequestWithUser,
  ) {
    return this.coursesService.update(
      courseId,
      req,
      file,
      request[REQUEST_USER_KEY].id,
    );
  }

  @UseGuards(AuthGuard)
  @Delete(':courseId')
  @HttpCode(200)
  @ZodSerializerDto(DeleteCourseResDTO)
  delete(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() request: RequestWithUser,
  ) {
    return this.coursesService.delete(courseId, request[REQUEST_USER_KEY].id);
  }
}
