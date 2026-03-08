import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import {
  CreateSectionType,
  DeleteSectionResType,
  SectionWithPaginationType,
  SectionWithRelationType,
} from './sections.model';

@Injectable()
export class SectionsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    sections: CreateSectionType,
  ): Promise<Omit<SectionWithRelationType, 'id'>> {
    return this.prismaService.section.create({
      data: sections,
      omit: {
        id: true,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            price: true,
            discount: true,
            status: true,
          },
        },
      },
    });
  }
  async getAllSections(
    page: number = 1,
    limit: number = 10,
  ): Promise<Omit<SectionWithPaginationType, 'id'>> {
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;
    const [data, total] = await Promise.all([
      this.prismaService.section.findMany({
        skip,
        take: limit,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnailUrl: true,
              price: true,
              discount: true,
              status: true,
            },
          },
        },
      }),
      this.prismaService.section.count(),
    ]);
    return {
      data,
      meta: {
        total,
        page: safePage,
        lastPage: Math.ceil(total / limit),
        hasNextPage: skip + limit < total,
        hasPrevPage: safePage > 1,
      },
    };
  }

  async findById(sectionId: number): Promise<SectionWithRelationType | null> {
    return this.prismaService.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            price: true,
            discount: true,
            status: true,
          },
        },
      },
    });
  }

  async findByCourseId(
    courseId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<Omit<SectionWithPaginationType, 'id'>> {
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;
    const [data, total] = await Promise.all([
      this.prismaService.section.findMany({
        skip,
        take: limit,
        where: { courseId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnailUrl: true,
              price: true,
              discount: true,
              status: true,
            },
          },
        },
      }),
      this.prismaService.section.count({
        where: { courseId },
      }),
    ]);
    return {
      data,
      meta: {
        total,
        page: safePage,
        lastPage: Math.ceil(total / limit),
        hasNextPage: skip + limit < total,
        hasPrevPage: safePage > 1,
      },
    };
  }

  async updateById(
    sectionId: number,
    updateData: Partial<CreateSectionType>,
  ): Promise<SectionWithRelationType> {
    return this.prismaService.section.update({
      where: { id: sectionId },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            price: true,
            discount: true,
            status: true,
          },
        },
      },
    });
  }

  async deleteById(sectionId: number): Promise<DeleteSectionResType> {
    await this.prismaService.section.delete({
      where: { id: sectionId },
      select: {
        id: true,
      },
    });
    return {
      message: 'Section deleted successfully',
    };
  }
}
