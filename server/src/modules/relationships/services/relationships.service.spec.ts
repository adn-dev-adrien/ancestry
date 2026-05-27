import { NotFoundException } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';
import { RelationshipsService } from './relationships.service';
import { RelationshipsRepository } from '../repositories/relationships.repository';

const TREE = 'tree-1';
const A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const C = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

describe('RelationshipsService', () => {
  let repo: jest.Mocked<RelationshipsRepository>;
  let service: RelationshipsService;

  beforeEach(() => {
    repo = {
      findPersonsByIds: jest.fn(),
      findByTree: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'rel-1' }),
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'rel-1' }),
      delete: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<RelationshipsRepository>;
    service = new RelationshipsService(repo);
  });

  const inTree = (...ids: string[]) =>
    repo.findPersonsByIds.mockResolvedValue(ids.map((id) => ({ id, treeId: TREE })));

  it('rejects a self relationship', async () => {
    await expect(
      service.create(TREE, { sourcePersonId: A, targetPersonId: A, type: RelationshipType.SPOUSE }),
    ).rejects.toMatchObject({ code: 'SELF_RELATIONSHIP' });
  });

  it('throws 404 when a person is missing', async () => {
    repo.findPersonsByIds.mockResolvedValue([{ id: A, treeId: TREE }]);
    await expect(
      service.create(TREE, { sourcePersonId: A, targetPersonId: B, type: RelationshipType.SPOUSE }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects cross-tree references', async () => {
    repo.findPersonsByIds.mockResolvedValue([
      { id: A, treeId: TREE },
      { id: B, treeId: 'other-tree' },
    ]);
    await expect(
      service.create(TREE, { sourcePersonId: A, targetPersonId: B, type: RelationshipType.SPOUSE }),
    ).rejects.toMatchObject({ code: 'CROSS_TREE_REFERENCE' });
  });

  it('rejects a duplicate parent-child in the same direction', async () => {
    inTree(A, B);
    repo.findByTree.mockResolvedValue([
      { id: 'r0', sourcePersonId: A, targetPersonId: B, type: RelationshipType.PARENT_CHILD },
    ]);
    await expect(
      service.create(TREE, {
        sourcePersonId: A,
        targetPersonId: B,
        type: RelationshipType.PARENT_CHILD,
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_RELATIONSHIP' });
  });

  it('rejects a duplicate spouse regardless of direction', async () => {
    inTree(A, B);
    repo.findByTree.mockResolvedValue([
      { id: 'r0', sourcePersonId: A, targetPersonId: B, type: RelationshipType.SPOUSE },
    ]);
    await expect(
      service.create(TREE, {
        sourcePersonId: B,
        targetPersonId: A,
        type: RelationshipType.SPOUSE,
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_RELATIONSHIP' });
  });

  it('rejects a cycle in the parent graph', async () => {
    // Existing A -> B, B -> C. Adding C -> A would make A its own ancestor.
    inTree(A, C);
    repo.findByTree.mockResolvedValue([
      { id: 'r1', sourcePersonId: A, targetPersonId: B, type: RelationshipType.PARENT_CHILD },
      { id: 'r2', sourcePersonId: B, targetPersonId: C, type: RelationshipType.PARENT_CHILD },
    ]);
    await expect(
      service.create(TREE, {
        sourcePersonId: C,
        targetPersonId: A,
        type: RelationshipType.PARENT_CHILD,
      }),
    ).rejects.toMatchObject({ code: 'RELATIONSHIP_CYCLE' });
  });

  it('rejects mixing parent-child and spouse on the same pair', async () => {
    inTree(A, B);
    repo.findByTree.mockResolvedValue([
      { id: 'r0', sourcePersonId: A, targetPersonId: B, type: RelationshipType.SPOUSE },
    ]);
    await expect(
      service.create(TREE, {
        sourcePersonId: A,
        targetPersonId: B,
        type: RelationshipType.PARENT_CHILD,
      }),
    ).rejects.toMatchObject({ code: 'MIXED_RELATIONSHIP_PAIR' });
  });

  it('creates a valid parent-child relationship', async () => {
    inTree(A, B);
    const result = await service.create(TREE, {
      sourcePersonId: A,
      targetPersonId: B,
      type: RelationshipType.PARENT_CHILD,
    });
    expect(result).toEqual({ id: 'rel-1' });
    expect(repo.create).toHaveBeenCalledWith(TREE, {
      sourcePersonId: A,
      targetPersonId: B,
      type: RelationshipType.PARENT_CHILD,
    });
  });

  it('normalizes the spouse pair before persisting', async () => {
    inTree(A, B);
    await service.create(TREE, {
      sourcePersonId: B,
      targetPersonId: A,
      type: RelationshipType.SPOUSE,
    });
    expect(repo.create).toHaveBeenCalledWith(TREE, {
      sourcePersonId: A,
      targetPersonId: B,
      type: RelationshipType.SPOUSE,
    });
  });

  describe('update', () => {
    it('throws 404 when the relationship is missing', async () => {
      repo.findById.mockResolvedValue(null as never);
      await expect(service.update('nope', { marriageDate: '1990-01-01' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects updating a non-spouse relationship', async () => {
      repo.findById.mockResolvedValue({ id: 'r1', type: RelationshipType.PARENT_CHILD } as never);
      await expect(service.update('r1', { marriageDate: '1990-01-01' })).rejects.toMatchObject({
        code: 'NOT_A_SPOUSE_RELATIONSHIP',
      });
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('persists marriage fields for a spouse relationship', async () => {
      repo.findById.mockResolvedValue({ id: 'r1', type: RelationshipType.SPOUSE } as never);
      await service.update('r1', { marriageDate: '1990-06-01', divorced: true, divorceDate: '2005-03-02' });
      expect(repo.update).toHaveBeenCalledWith('r1', {
        marriageDate: '1990-06-01',
        divorced: true,
        divorceDate: '2005-03-02',
      });
    });
  });
});
