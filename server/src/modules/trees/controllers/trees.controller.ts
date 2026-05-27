import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CreateTreeDto,
  UpdateTreeDto,
  createTreeSchema,
  updateTreeSchema,
} from '../dto/tree.dto';
import { TreesService } from '../services/trees.service';

@Controller('trees')
export class TreesController {
  constructor(private readonly service: TreesService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createTreeSchema)) dto: CreateTreeDto) {
    return this.service.create(dto);
  }

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':treeId')
  get(@Param('treeId') treeId: string) {
    return this.service.getWithGraph(treeId);
  }

  @Patch(':treeId')
  update(
    @Param('treeId') treeId: string,
    @Body(new ZodValidationPipe(updateTreeSchema)) dto: UpdateTreeDto,
  ) {
    return this.service.update(treeId, dto);
  }

  @Delete(':treeId')
  @HttpCode(204)
  async remove(@Param('treeId') treeId: string) {
    await this.service.delete(treeId);
  }
}
