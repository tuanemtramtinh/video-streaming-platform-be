import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateSectionDTO, UpdateSectionBodyDTO } from './sections.dto';
import { SectionsRepository } from './sections.repo';
import { CoursesRepository } from '../courses/courses.repo';
import { PaginationType } from 'src/shared/models/pagination.model';
import { S3Service } from 'src/shared/services/s3.service';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config/env.schema';

@Injectable()
export class SectionsService {
  constructor(
    private readonly sectionsRepository: SectionsRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService<Config>,
  ) {}

  async create(sections: CreateSectionDTO) {
    const course = await this.coursesRepository.findById(sections.courseId);
    if (!course) {
      throw new UnprocessableEntityException('Course is not exist');
    }
    return this.sectionsRepository.create(sections);
  }

  async getSections(pagination: PaginationType) {
    const { page, limit } = pagination;
    const { data, meta } = await this.sectionsRepository.getAllSections(
      page,
      limit,
    );
    const lastPage = Math.ceil(meta.total / limit);
    return { data, meta: { ...meta, lastPage } };
  }

  async getSectionById(sectionId: number) {
    const section = await this.sectionsRepository.findById(sectionId);
    if (!section) {
      throw new NotFoundException('Section is not exist');
    }
    return section;
  }

  async getSectionsByCourseId(courseId: number, pagination: PaginationType) {
    const { page, limit } = pagination;
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new UnprocessableEntityException('Course is not exist');
    }
    const { data, meta } = await this.sectionsRepository.findByCourseId(
      courseId,
      page,
      limit,
    );
    const lastPage = Math.ceil(meta.total / limit);
    return { data, meta: { ...meta, lastPage } };
  }

  async updateSection(
    sectionId: number,
    updateSectionBody: UpdateSectionBodyDTO,
  ) {
    const section = await this.sectionsRepository.findById(sectionId);
    if (!section) {
      throw new NotFoundException('Section is not exist');
    }
    return this.sectionsRepository.updateById(sectionId, updateSectionBody);
  }

  async deleteSection(sectionId: number) {
    const section = await this.sectionsRepository.findById(sectionId);
    if (!section) {
      throw new NotFoundException('Section is not exist');
    }
    return this.sectionsRepository.deleteById(sectionId);
  }
}
