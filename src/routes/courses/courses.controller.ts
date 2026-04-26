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
  CourseDetailWithIsEnrolledResDTO,
  StudentEnrollCourseResDTO,
  CourseWithIsEnrolledPaginationDTO,
  EnrollmentListResDTO,
  RemoveWishlistCourseResDTO,
} from 'src/routes/courses/courses.dto';
import { CoursesService } from 'src/routes/courses/courses.service';
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { OptionalAuthGuard } from 'src/shared/guards/optional-auth.guard';
import { Request } from 'express';
import {
  PaginationSchema,
  type PaginationInputType,
} from 'src/shared/models/pagination.model';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  EnrollmentListQuerySchema,
  SearchCourseQuerySchema,
} from 'src/routes/courses/courses.model';
import type {
  EnrollmentListQueryType,
  SearchCourseQueryType,
} from 'src/routes/courses/courses.model';

type RequestWithUser = Request & {
  [REQUEST_USER_KEY]: { id: number };
};

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

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
    return this.coursesService.create(file, req, request[REQUEST_USER_KEY].id);
  }

  @UseGuards(OptionalAuthGuard)
  @Get()
  @HttpCode(200)
  @ZodSerializerDto(CourseWithIsEnrolledPaginationDTO)
  getCourses(
    @Query() query: PaginationInputType,
    @Req() request: RequestWithUser,
  ) {
    const validatedPagination = PaginationSchema.parse(query);
    const userId = request[REQUEST_USER_KEY]?.id ?? null;
    return this.coursesService.getCourses(validatedPagination, userId);
  }

  @Get('search')
  @HttpCode(200)
  @ZodSerializerDto(CourseWithPaginationDTO)
  searchCourses(@Query() query: SearchCourseQueryType) {
    const validatedQuery = SearchCourseQuerySchema.parse(query);
    return this.coursesService.searchCourses(validatedQuery);
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
  @Get('me/enrolled')
  @HttpCode(200)
  @ZodSerializerDto(CourseWithIsEnrolledPaginationDTO)
  getEnrolledCourses(
    @Query() query: PaginationInputType,
    @Req() request: RequestWithUser,
  ) {
    const validatedPagination = PaginationSchema.parse(query);
    return this.coursesService.getEnrolledCourses(
      request[REQUEST_USER_KEY].id,
      validatedPagination,
    );
  }

  @UseGuards(OptionalAuthGuard)
  @Get(':courseId')
  @HttpCode(200)
  @ZodSerializerDto(CourseDetailWithIsEnrolledResDTO)
  getCourseById(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() request: RequestWithUser,
  ) {
    const userId = request[REQUEST_USER_KEY]?.id ?? null;
    return this.coursesService.getCourseById(courseId, userId);
  }

  @UseGuards(AuthGuard)
  @Get(':courseId/enrollments')
  @HttpCode(200)
  @ZodSerializerDto(EnrollmentListResDTO)
  getEnrollmentsByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query() query: EnrollmentListQueryType,
  ) {
    const validatedQuery = EnrollmentListQuerySchema.parse(query);
    return this.coursesService.getEnrollmentsByCourse(courseId, validatedQuery);
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
  @Delete(':courseId/wishlist')
  @HttpCode(200)
  @ZodSerializerDto(RemoveWishlistCourseResDTO)
  removeFromWishlist(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() request: RequestWithUser,
  ) {
    return this.coursesService.removeCourseFromWishlist(
      courseId,
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

  @UseGuards(AuthGuard)
  @Post(':courseId/enroll')
  @HttpCode(200)
  @ZodSerializerDto(StudentEnrollCourseResDTO)
  enroll(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() request: RequestWithUser,
  ) {
    return this.coursesService.studentEnrollCourse(
      courseId,
      request[REQUEST_USER_KEY].id,
    );
  }
}
