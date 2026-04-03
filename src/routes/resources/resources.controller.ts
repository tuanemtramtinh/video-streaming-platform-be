import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  HttpCode,
} from '@nestjs/common';
import { ResourcesService } from 'src/routes/resources/resources.service';
import {
  CreateResourceDTO,
  CreateResourceResDTO,
  LessonsByResourceResDTO,
  UpdateResourceDTO,
  UploadResourceBodyDTO,
  UploadResourceResDTO,
} from 'src/routes/resources/resources.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  PaginationSchema,
  type PaginationInputType,
} from 'src/shared/models/pagination.model';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourceService: ResourcesService) {}

  @Post('upload')
  @ZodSerializerDto(UploadResourceResDTO)
  async uploadResource(@Body() body: UploadResourceBodyDTO) {
    return this.resourceService.uploadResource(body.fileName, body.fileType);
  }

  @Post()
  @ZodSerializerDto(CreateResourceResDTO)
  async createResource(@Body() body: CreateResourceDTO) {
    return this.resourceService.createResource(body);
  }

  @Get(':resourceId/lessons')
  @ZodSerializerDto(LessonsByResourceResDTO)
  async getLessonsByResourceId(
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ) {
    return this.resourceService.getLessonsByResourceId(resourceId);
  }

  @Patch(':resourceId')
  @HttpCode(200)
  async updateResource(
    @Param('resourceId', ParseIntPipe) resourceId: number,
    @Body() body: UpdateResourceDTO,
  ) {
    return this.resourceService.updateResource(resourceId, body);
  }

  @Get('/courses/:courseId')
  async getAllResources(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query() query: PaginationInputType,
  ) {
    const validatedPagination = PaginationSchema.parse(query);
    return this.resourceService.getAllResources(courseId, validatedPagination);
  }
}
