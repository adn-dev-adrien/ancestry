import { NotFoundException } from '@nestjs/common';
import { ImportExportService } from './import-export.service';
import type { ExportPayload } from '../dto/import.dto';

const payload: ExportPayload = {
  version: 1,
  tree: { title: 'My family', description: null },
  persons: [
    { id: 'a', givenName: 'Ada', photo: 'data:image/jpeg;base64,abc' },
    { id: 'b', givenName: 'Bob' },
  ],
  relationships: [{ sourcePersonId: 'a', targetPersonId: 'b', type: 'PARENT_CHILD' }],
};

function makeTx() {
  const now = new Date();
  return {
    tree: {
      create: jest.fn().mockResolvedValue({ id: 'new', title: 'My family', description: null, createdAt: now, updatedAt: now }),
      update: jest.fn().mockResolvedValue({ id: 't1', title: 'My family', description: null, createdAt: now, updatedAt: now }),
    },
    person: { createMany: jest.fn(), deleteMany: jest.fn() },
    relationship: { createMany: jest.fn() },
  };
}

describe('ImportExportService', () => {
  let tx: ReturnType<typeof makeTx>;
  let prisma: { $transaction: jest.Mock };
  let trees: { findByIdWithGraph: jest.Mock; exists: jest.Mock };
  let service: ImportExportService;

  beforeEach(() => {
    tx = makeTx();
    prisma = { $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)) };
    trees = { findByIdWithGraph: jest.fn(), exists: jest.fn() };
    service = new ImportExportService(prisma as never, trees as never);
  });

  it('export returns a version 1 payload', async () => {
    trees.findByIdWithGraph.mockResolvedValue({
      id: 't1',
      title: 'My family',
      description: null,
      persons: [
        { id: 'p1', givenName: 'Ada', familyName: null, birthName: null, birthDate: null, deathDate: null, living: false, birthPlace: null, birthPlaceUncertain: false, deathPlace: 'London', deathPlaceUncertain: true, photo: 'data:image/jpeg;base64,abc', gender: null, notes: null, x: null, y: null },
        { id: 'p2', givenName: 'Bob', familyName: null, birthName: null, birthDate: null, deathDate: null, living: false, birthPlace: null, birthPlaceUncertain: false, deathPlace: null, deathPlaceUncertain: false, photo: null, gender: null, notes: null, x: null, y: null },
      ],
      relationships: [{ sourcePersonId: 'p1', targetPersonId: 'p2', type: 'PARENT_CHILD' }],
    });

    const result = await service.export('t1');

    expect(result.version).toBe(1);
    expect(result.persons).toHaveLength(2);
    expect(result.persons[0].photo).toBe('data:image/jpeg;base64,abc');
    expect(result.persons[0].deathPlace).toBe('London');
    expect(result.persons[0].deathPlaceUncertain).toBe(true);
    expect(result.relationships[0].sourcePersonId).toBe('p1');
  });

  it('export throws 404 when the tree is missing', async () => {
    trees.findByIdWithGraph.mockResolvedValue(null);
    await expect(service.export('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('importNew creates a tree and links relationships to the remapped ids', async () => {
    const result = await service.importNew(payload);

    expect(result.personCount).toBe(2);
    const personData = tx.person.createMany.mock.calls[0][0].data;
    const relData = tx.relationship.createMany.mock.calls[0][0].data;
    const ada = personData.find((p: { givenName: string }) => p.givenName === 'Ada');
    const bob = personData.find((p: { givenName: string }) => p.givenName === 'Bob');

    // Ids are remapped (not the file-local 'a'/'b') and relationships use the new ids.
    expect(ada.id).not.toBe('a');
    expect(ada.photo).toBe('data:image/jpeg;base64,abc');
    expect(relData[0].sourcePersonId).toBe(ada.id);
    expect(relData[0].targetPersonId).toBe(bob.id);
  });

  it('importReplace clears the existing graph then recreates it', async () => {
    trees.exists.mockResolvedValue(true);
    await service.importReplace('t1', payload);
    expect(tx.person.deleteMany).toHaveBeenCalledWith({ where: { treeId: 't1' } });
    expect(tx.tree.update).toHaveBeenCalled();
    expect(tx.person.createMany).toHaveBeenCalled();
  });

  it('importReplace throws 404 for a missing tree without touching the db', async () => {
    trees.exists.mockResolvedValue(false);
    await expect(service.importReplace('nope', payload)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
