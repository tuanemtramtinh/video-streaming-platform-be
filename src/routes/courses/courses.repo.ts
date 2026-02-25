import { Injectable } from '@nestjs/common';
import {
    CourseType,
    UpdateCourseBodyType,
} from 'src/routes/courses/courses.model';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class CoursesRepository {
    constructor(private readonly prismaService: PrismaService) { }

    async findById(courseId: number): Promise<CourseType | null> {
        return this.prismaService.course.findUnique({
            where: {
                id: courseId,
            },
        });
    }

    async updateById(
        courseId: number,
        data: UpdateCourseBodyType,
    ): Promise<CourseType> {
        return this.prismaService.course.update({
            where: {
                id: courseId,
            },
            data,
        });
    }

    async deleteById(courseId: number): Promise<CourseType> {
        return this.prismaService.course.delete({
            where: {
                id: courseId,
            },
        });
    }
}
