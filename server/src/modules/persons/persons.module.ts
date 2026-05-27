import { Module } from '@nestjs/common';
import {
  PersonsController,
  TreePersonsController,
} from './controllers/persons.controller';
import { PersonsRepository } from './repositories/persons.repository';
import { PersonsService } from './services/persons.service';

@Module({
  controllers: [TreePersonsController, PersonsController],
  providers: [PersonsService, PersonsRepository],
})
export class PersonsModule {}
