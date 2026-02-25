import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { UpdateCourseBodyDTO } from 'src/routes/courses/courses.dto';
import { CoursesRepository } from 'src/routes/courses/courses.repo';

@Injectable()
export class CoursesService {
    constructor(private readonly coursesRepository: CoursesRepository) { }

    async update(courseId: number, req: UpdateCourseBodyDTO, userId: number) {
        const currentCourse = await this.coursesRepository.findById(courseId);

        if (!currentCourse) {
            throw new NotFoundException('Course is not found');
        }

        if (currentCourse.instructorId !== userId) {
            throw new ForbiddenException(
                'You do not have permission to update this course',
            );
        }

        return this.coursesRepository.updateById(courseId, req);
    }

    async delete(courseId: number, userId: number) {
        const currentCourse = await this.coursesRepository.findById(courseId);

        if (!currentCourse) {
            throw new NotFoundException('Course is not found');
        }

        if (currentCourse.instructorId !== userId) {
            throw new ForbiddenException(
                'You do not have permission to delete this course',
            );
        }

        await this.coursesRepository.deleteById(courseId);

        return {
            message: 'Course deleted successfully',
        };
    }
}
