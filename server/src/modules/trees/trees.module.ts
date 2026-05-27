import { Module } from '@nestjs/common';
import { TreesController } from './controllers/trees.controller';
import { TreesRepository } from './repositories/trees.repository';
import { TreesService } from './services/trees.service';

@Module({
  controllers: [TreesController],
  providers: [TreesService, TreesRepository],
})
export class TreesModule {}
