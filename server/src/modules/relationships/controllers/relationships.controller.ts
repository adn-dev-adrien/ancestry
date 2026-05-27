import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CreateRelationshipDto,
  UpdateRelationshipDto,
  createRelationshipSchema,
  updateRelationshipSchema,
} from '../dto/relationship.dto';
import { RelationshipsService } from '../services/relationships.service';

@Controller('trees/:treeId/relationships')
export class TreeRelationshipsController {
  constructor(private readonly service: RelationshipsService) {}

  @Post()
  create(
    @Param('treeId') treeId: string,
    @Body(new ZodValidationPipe(createRelationshipSchema)) dto: CreateRelationshipDto,
  ) {
    return this.service.create(treeId, dto);
  }
}

@Controller('relationships')
export class RelationshipsController {
  constructor(private readonly service: RelationshipsService) {}

  @Patch(':relationshipId')
  update(
    @Param('relationshipId') relationshipId: string,
    @Body(new ZodValidationPipe(updateRelationshipSchema)) dto: UpdateRelationshipDto,
  ) {
    return this.service.update(relationshipId, dto);
  }

  @Delete(':relationshipId')
  @HttpCode(204)
  async remove(@Param('relationshipId') relationshipId: string) {
    await this.service.delete(relationshipId);
  }
}
