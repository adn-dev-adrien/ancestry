import { Injectable, NotFoundException } from '@nestjs/common';
import { Person } from '@prisma/client';
import { BusinessRuleException } from '../../../common/errors/business.exceptions';
import { PersonsRepository } from '../repositories/persons.repository';
import { CreatePersonDto, UpdatePersonDto } from '../dto/person.dto';

function assertDateOrder(birthDate?: string | null, deathDate?: string | null): void {
  if (birthDate && deathDate && deathDate < birthDate) {
    throw new BusinessRuleException(
      'INVALID_DATE_RANGE',
      'deathDate must be greater than or equal to birthDate',
    );
  }
}

@Injectable()
export class PersonsService {
  constructor(private readonly repo: PersonsRepository) {}

  async create(treeId: string, dto: CreatePersonDto): Promise<Person> {
    if (!(await this.repo.treeExists(treeId))) {
      throw new NotFoundException(`Tree ${treeId} not found`);
    }
    assertDateOrder(dto.birthDate, dto.deathDate);
    return this.repo.create(treeId, {
      givenName: dto.givenName,
      additionalGivenNames: dto.additionalGivenNames ?? null,
      familyName: dto.familyName ?? null,
      birthName: dto.birthName ?? null,
      birthDate: dto.birthDate ?? null,
      deathDate: dto.deathDate ?? null,
      living: dto.living ?? false,
      birthPlace: dto.birthPlace ?? null,
      birthPlaceUncertain: dto.birthPlaceUncertain ?? false,
      deathPlace: dto.deathPlace ?? null,
      deathPlaceUncertain: dto.deathPlaceUncertain ?? false,
      photo: dto.photo ?? null,
      gender: dto.gender ?? null,
      notes: dto.notes ?? null,
      x: dto.x ?? null,
      y: dto.y ?? null,
    });
  }

  async update(id: string, dto: UpdatePersonDto): Promise<Person> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Person ${id} not found`);

    const birthDate = dto.birthDate !== undefined ? dto.birthDate : existing.birthDate;
    const deathDate = dto.deathDate !== undefined ? dto.deathDate : existing.deathDate;
    assertDateOrder(birthDate, deathDate);

    return this.repo.update(id, {
      ...(dto.givenName !== undefined ? { givenName: dto.givenName } : {}),
      ...(dto.additionalGivenNames !== undefined
        ? { additionalGivenNames: dto.additionalGivenNames }
        : {}),
      ...(dto.familyName !== undefined ? { familyName: dto.familyName } : {}),
      ...(dto.birthName !== undefined ? { birthName: dto.birthName } : {}),
      ...(dto.birthDate !== undefined ? { birthDate: dto.birthDate } : {}),
      ...(dto.deathDate !== undefined ? { deathDate: dto.deathDate } : {}),
      ...(dto.living !== undefined ? { living: dto.living } : {}),
      ...(dto.birthPlace !== undefined ? { birthPlace: dto.birthPlace } : {}),
      ...(dto.birthPlaceUncertain !== undefined
        ? { birthPlaceUncertain: dto.birthPlaceUncertain }
        : {}),
      ...(dto.deathPlace !== undefined ? { deathPlace: dto.deathPlace } : {}),
      ...(dto.deathPlaceUncertain !== undefined
        ? { deathPlaceUncertain: dto.deathPlaceUncertain }
        : {}),
      ...(dto.photo !== undefined ? { photo: dto.photo } : {}),
      ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(dto.x !== undefined ? { x: dto.x } : {}),
      ...(dto.y !== undefined ? { y: dto.y } : {}),
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Person ${id} not found`);
    await this.repo.delete(id);
  }
}
