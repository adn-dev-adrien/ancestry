import { Module } from '@nestjs/common';
import { TreesController } from './controllers/trees.controller';
import { ImportExportController } from './controllers/import-export.controller';
import { TreesRepository } from './repositories/trees.repository';
import { TreesService } from './services/trees.service';
import { ImportExportService } from './services/import-export.service';

@Module({
  controllers: [TreesController, ImportExportController],
  providers: [TreesService, TreesRepository, ImportExportService],
})
export class TreesModule {}
