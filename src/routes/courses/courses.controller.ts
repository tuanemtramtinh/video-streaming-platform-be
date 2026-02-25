import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateCourseDTO } from './courses.dto';
import { CoursesService } from './courses.service';
import {
  PaginationSchema,
  type PaginationInputType,
} from 'src/shared/models/pagination.model';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @HttpCode(201)
  async CreateCourses(@Body() req: CreateCourseDTO) {
    return this.coursesService.create(req);
  }

  @Get()
  @HttpCode(200)
  async getCourses(@Query() query: PaginationInputType) {
    const validatedPagination = PaginationSchema.parse(query);
    return this.coursesService.getCourses(validatedPagination);
  }

  @Get('/:id')
  @HttpCode(200)
  async getCourseById(@Param('id') id: number) {
    return this.coursesService.getCourseById(id);
  }
}
