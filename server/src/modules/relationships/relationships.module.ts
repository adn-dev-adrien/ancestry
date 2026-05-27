import { Module } from '@nestjs/common';
import {
  RelationshipsController,
  TreeRelationshipsController,
} from './controllers/relationships.controller';
import { RelationshipsRepository } from './repositories/relationships.repository';
import { RelationshipsService } from './services/relationships.service';

@Module({
  controllers: [TreeRelationshipsController, RelationshipsController],
  providers: [RelationshipsService, RelationshipsRepository],
})
export class RelationshipsModule {}
