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
  CreatePersonDto,
  UpdatePersonDto,
  createPersonSchema,
  updatePersonSchema,
} from '../dto/person.dto';
import { PersonsService } from '../services/persons.service';

@Controller('trees/:treeId/persons')
export class TreePersonsController {
  constructor(private readonly service: PersonsService) {}

  @Post()
  create(
    @Param('treeId') treeId: string,
    @Body(new ZodValidationPipe(createPersonSchema)) dto: CreatePersonDto,
  ) {
    return this.service.create(treeId, dto);
  }
}

@Controller('persons')
export class PersonsController {
  constructor(private readonly service: PersonsService) {}

  @Patch(':personId')
  update(
    @Param('personId') personId: string,
    @Body(new ZodValidationPipe(updatePersonSchema)) dto: UpdatePersonDto,
  ) {
    return this.service.update(personId, dto);
  }

  @Delete(':personId')
  @HttpCode(204)
  async remove(@Param('personId') personId: string) {
    await this.service.delete(personId);
  }
}
