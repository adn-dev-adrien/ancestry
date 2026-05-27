import { NotFoundException } from '@nestjs/common';
import { TreesService } from './trees.service';
import { TreesRepository } from '../repositories/trees.repository';

describe('TreesService', () => {
  let repo: jest.Mocked<TreesRepository>;
  let service: TreesService;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findManyWithCount: jest.fn(),
      findByIdWithGraph: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<TreesRepository>;
    service = new TreesService(repo);
  });

  it('create returns a summary with the person count', async () => {
    const now = new Date();
    repo.create.mockResolvedValue({
      id: 't1',
      title: 'My tree',
      description: null,
      createdAt: now,
      updatedAt: now,
      _count: { persons: 0 },
    } as never);

    const result = await service.create({ title: 'My tree' });

    expect(result).toEqual({
      id: 't1',
      title: 'My tree',
      description: null,
      createdAt: now,
      updatedAt: now,
      personCount: 0,
    });
  });

  it('getWithGraph throws 404 when the tree is missing', async () => {
    repo.findByIdWithGraph.mockResolvedValue(null as never);
    await expect(service.getWithGraph('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getWithGraph includes persons and relationships', async () => {
    const now = new Date();
    repo.findByIdWithGraph.mockResolvedValue({
      id: 't1',
      title: 'T',
      description: null,
      createdAt: now,
      updatedAt: now,
      _count: { persons: 2 },
      persons: [{ id: 'p1' }, { id: 'p2' }],
      relationships: [{ id: 'r1' }],
    } as never);

    const result = await service.getWithGraph('t1');

    expect(result.personCount).toBe(2);
    expect(result.persons).toHaveLength(2);
    expect(result.relationships).toHaveLength(1);
  });

  it('delete throws 404 when the tree is missing', async () => {
    repo.exists.mockResolvedValue(false);
    await expect(service.delete('nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
