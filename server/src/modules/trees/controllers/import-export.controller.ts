import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { ExportPayload, exportPayloadSchema } from '../dto/import.dto';
import { ImportExportService } from '../services/import-export.service';

@Controller('trees')
export class ImportExportController {
  constructor(private readonly service: ImportExportService) {}

  @Get(':treeId/export')
  export(@Param('treeId') treeId: string) {
    return this.service.export(treeId);
  }

  @Post('import')
  importNew(@Body(new ZodValidationPipe(exportPayloadSchema)) payload: ExportPayload) {
    return this.service.importNew(payload);
  }

  @Post(':treeId/import')
  @HttpCode(200)
  importReplace(
    @Param('treeId') treeId: string,
    @Body(new ZodValidationPipe(exportPayloadSchema)) payload: ExportPayload,
  ) {
    return this.service.importReplace(treeId, payload);
  }
}
