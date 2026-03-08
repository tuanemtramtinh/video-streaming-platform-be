import { Injectable } from '@nestjs/common';
import {
    CreateLessonType,
    LessonType,
    LessonWithRelationType,
    UpdateLessonBodyType,
} from 'src/routes/lessons/lessons.model';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class LessonsRepository {
    constructor(private readonly prismaService: PrismaService) { }

    async findSectionById(sectionId: number) {
        return this.prismaService.section.findUnique({
            where: {
                id: sectionId,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        instructorId: true,
                    },
                },
            },
        });
    }

    async create(data: CreateLessonType): Promise<LessonWithRelationType> {
        return this.prismaService.lesson.create({
            data,
            include: {
                section: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                    },
                },
            },
        });
    }

    async getAllLessons(page: number = 1, limit: number = 10, sectionId?: number) {
        const safePage = Math.max(1, page);
        const skip = (safePage - 1) * limit;

        const whereClause = sectionId
            ? {
                sectionId,
            }
            : {};

        const [data, total] = await Promise.all([
            this.prismaService.lesson.findMany({
                skip,
                take: limit,
                where: whereClause,
                orderBy: {
                    orderIndex: 'asc',
                },
                include: {
                    section: {
                        select: {
                            id: true,
                            title: true,
                            courseId: true,
                        },
                    },
                },
            }),
            this.prismaService.lesson.count({
                where: whereClause,
            }),
        ]);

        return { data, meta: { total, page: safePage } };
    }

    async findById(lessonId: number) {
        return this.prismaService.lesson.findUnique({
            where: {
                id: lessonId,
            },
            include: {
                section: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                instructorId: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async updateById(
        lessonId: number,
        data: UpdateLessonBodyType,
    ): Promise<LessonWithRelationType> {
        return this.prismaService.lesson.update({
            where: {
                id: lessonId,
            },
            data,
            include: {
                section: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                    },
                },
            },
        });
    }

    async deleteById(lessonId: number): Promise<LessonType> {
        return this.prismaService.lesson.delete({
            where: {
                id: lessonId,
            },
        });
    }
}
