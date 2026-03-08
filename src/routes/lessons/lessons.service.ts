import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { LessonsRepository } from 'src/routes/lessons/lessons.repo';
import {
    CreateLessonDTO,
    UpdateLessonBodyDTO,
} from 'src/routes/lessons/lessons.dto';
import { LessonPaginationQueryType } from 'src/routes/lessons/lessons.model';

@Injectable()
export class LessonsService {
    constructor(private readonly lessonsRepository: LessonsRepository) { }

    async create(req: CreateLessonDTO, userId: number) {
        const section = await this.lessonsRepository.findSectionById(req.sectionId);

        if (!section) {
            throw new NotFoundException('Section is not found');
        }

        if (section.course.instructorId !== userId) {
            throw new ForbiddenException(
                'You do not have permission to create lesson in this section',
            );
        }

        return this.lessonsRepository.create(req);
    }

    async getLessons(pagination: LessonPaginationQueryType) {
        const { page, limit, sectionId } = pagination;
        const { data, meta } = await this.lessonsRepository.getAllLessons(
            page,
            limit,
            sectionId,
        );
        const lastPage = Math.ceil(meta.total / limit);

        return {
            data,
            meta: {
                ...meta,
                lastPage,
                hasNextPage: page < lastPage,
                hasPrevPage: page > 1,
            },
        };
    }

    async getLessonById(lessonId: number) {
        const lesson = await this.lessonsRepository.findById(lessonId);

        if (!lesson) {
            throw new NotFoundException('Lesson is not found');
        }

        return lesson;
    }

    async update(lessonId: number, req: UpdateLessonBodyDTO, userId: number) {
        const currentLesson = await this.lessonsRepository.findById(lessonId);

        if (!currentLesson) {
            throw new NotFoundException('Lesson is not found');
        }

        if (currentLesson.section.course.instructorId !== userId) {
            throw new ForbiddenException(
                'You do not have permission to update this lesson',
            );
        }

        if (req.sectionId) {
            const newSection = await this.lessonsRepository.findSectionById(req.sectionId);

            if (!newSection) {
                throw new NotFoundException('Section is not found');
            }

            if (newSection.course.instructorId !== userId) {
                throw new ForbiddenException(
                    'You do not have permission to move lesson to this section',
                );
            }
        }

        return this.lessonsRepository.updateById(lessonId, req);
    }

    async delete(lessonId: number, userId: number) {
        const currentLesson = await this.lessonsRepository.findById(lessonId);

        if (!currentLesson) {
            throw new NotFoundException('Lesson is not found');
        }

        if (currentLesson.section.course.instructorId !== userId) {
            throw new ForbiddenException(
                'You do not have permission to delete this lesson',
            );
        }

        await this.lessonsRepository.deleteById(lessonId);

        return {
            message: 'Lesson deleted successfully',
        };
    }
}
