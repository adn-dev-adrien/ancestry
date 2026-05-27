import { NotFoundException } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { PersonsRepository } from '../repositories/persons.repository';

describe('PersonsService', () => {
  let repo: jest.Mocked<PersonsRepository>;
  let service: PersonsService;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      treeExists: jest.fn(),
    } as unknown as jest.Mocked<PersonsRepository>;
    service = new PersonsService(repo);
  });

  it('create rejects when the tree does not exist', async () => {
    repo.treeExists.mockResolvedValue(false);
    await expect(
      service.create('missing', { givenName: 'Ada' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('create rejects when deathDate precedes birthDate', async () => {
    repo.treeExists.mockResolvedValue(true);
    await expect(
      service.create('t1', { givenName: 'Ada', birthDate: '1900-01-01', deathDate: '1899-01-01' }),
    ).rejects.toMatchObject({ code: 'INVALID_DATE_RANGE' });
  });

  it('create persists the person with normalized nulls and defaults', async () => {
    repo.treeExists.mockResolvedValue(true);
    repo.create.mockResolvedValue({ id: 'p1' } as never);
    await service.create('t1', { givenName: 'Ada' });
    expect(repo.create).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({
        givenName: 'Ada',
        familyName: null,
        birthName: null,
        birthPlace: null,
        birthPlaceUncertain: false,
        living: false,
        x: null,
      }),
    );
  });

  it('create threads the new fields through', async () => {
    repo.treeExists.mockResolvedValue(true);
    repo.create.mockResolvedValue({ id: 'p1' } as never);
    await service.create('t1', {
      givenName: 'Ada',
      birthName: 'Byron',
      living: true,
      birthPlace: 'London',
      birthPlaceUncertain: true,
      photo: 'data:image/jpeg;base64,abc',
    });
    expect(repo.create).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({
        birthName: 'Byron',
        living: true,
        birthPlace: 'London',
        birthPlaceUncertain: true,
        photo: 'data:image/jpeg;base64,abc',
      }),
    );
  });

  it('update validates dates against the merged record', async () => {
    repo.findById.mockResolvedValue({ id: 'p1', birthDate: '1950-01-01', deathDate: null } as never);
    await expect(
      service.update('p1', { deathDate: '1940-01-01' }),
    ).rejects.toMatchObject({ code: 'INVALID_DATE_RANGE' });
  });

  it('delete throws 404 when the person is missing', async () => {
    repo.findById.mockResolvedValue(null as never);
    await expect(service.delete('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
