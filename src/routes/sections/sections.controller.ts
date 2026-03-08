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
  UseGuards,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { SectionsService } from './sections.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant';
import { Request } from 'express';
import {
  PaginationSchema,
  type PaginationInputType,
} from 'src/shared/models/pagination.model';
import {
  CreateSectionDTO,
  CreateSectionResDTO,
  SectionWithPaginationDTO,
  SectionWithRelationDTO,
} from './sections.dto';

type RequestWithUser = Request & {
  [REQUEST_USER_KEY]: {
    id: number;
  };
};

@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(201)
  @ZodSerializerDto(CreateSectionResDTO)
  createSections(@Body() req: CreateSectionDTO) {
    return this.sectionsService.create(req);
  }

  @UseGuards(AuthGuard)
  @Get()
  @HttpCode(200)
  @ZodSerializerDto(SectionWithPaginationDTO)
  getSections(@Query() query: PaginationInputType) {
    const validatedPagination = PaginationSchema.parse(query);
    return this.sectionsService.getSections(validatedPagination);
  }

  @UseGuards(AuthGuard)
  @Get(':sectionId')
  @HttpCode(200)
  @ZodSerializerDto(SectionWithRelationDTO)
  getSectionById(@Param('sectionId', ParseIntPipe) sectionId: number) {
    return this.sectionsService.getSectionById(sectionId);
  }

  @UseGuards(AuthGuard)
  @Get('course/:courseId')
  @HttpCode(200)
  @ZodSerializerDto(SectionWithPaginationDTO)
  getSectionsByCourseId(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.sectionsService.getSectionsByCourseId(courseId);
  }

  @UseGuards(AuthGuard)
  @Patch(':sectionId')
  @HttpCode(200)
  @ZodSerializerDto(SectionWithRelationDTO)
  updateSection(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() updateSectionBody: CreateSectionDTO,
  ) {
    return this.sectionsService.updateSection(sectionId, updateSectionBody);
  }

  @UseGuards(AuthGuard)
  @Delete(':sectionId')
  @HttpCode(200)
  deleteSection(@Param('sectionId', ParseIntPipe) sectionId: number) {
    return this.sectionsService.deleteSection(sectionId);
  }
}
