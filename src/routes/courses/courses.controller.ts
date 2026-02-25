import {
    Body,
    Controller,
    Delete,
    Param,
    ParseIntPipe,
    Patch,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import {
    CourseResDTO,
    DeleteCourseResDTO,
    UpdateCourseBodyDTO,
} from 'src/routes/courses/courses.dto';
import { CoursesService } from 'src/routes/courses/courses.service';
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { Request } from 'express';

type RequestWithUser = Request & {
    [REQUEST_USER_KEY]: {
        id: number;
    };
};

@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    @UseGuards(AuthGuard)
    @Patch(':courseId')
    @ZodSerializerDto(CourseResDTO)
    update(
        @Param('courseId', ParseIntPipe) courseId: number,
        @Body() req: UpdateCourseBodyDTO,
        @Req() request: RequestWithUser,
    ) {
        return this.coursesService.update(courseId, req, request[REQUEST_USER_KEY].id);
    }

    @UseGuards(AuthGuard)
    @Delete(':courseId')
    @ZodSerializerDto(DeleteCourseResDTO)
    delete(
        @Param('courseId', ParseIntPipe) courseId: number,
        @Req() request: RequestWithUser,
    ) {
        return this.coursesService.delete(courseId, request[REQUEST_USER_KEY].id);
    }
}
