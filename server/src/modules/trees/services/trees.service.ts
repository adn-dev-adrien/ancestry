import { Injectable, NotFoundException } from '@nestjs/common';
import { Person, Relationship, Tree } from '@prisma/client';
import { TreesRepository } from '../repositories/trees.repository';
import { CreateTreeDto, TreeSummary, UpdateTreeDto } from '../dto/tree.dto';

type TreeWithCount = Tree & { _count: { persons: number } };

function toSummary(tree: TreeWithCount): TreeSummary {
  return {
    id: tree.id,
    title: tree.title,
    description: tree.description,
    createdAt: tree.createdAt,
    updatedAt: tree.updatedAt,
    personCount: tree._count.persons,
  };
}

@Injectable()
export class TreesService {
  constructor(private readonly repo: TreesRepository) {}

  async create(dto: CreateTreeDto): Promise<TreeSummary> {
    const tree = await this.repo.create({
      title: dto.title,
      description: dto.description ?? null,
    });
    return toSummary(tree);
  }

  async list(): Promise<TreeSummary[]> {
    const trees = await this.repo.findManyWithCount();
    return trees.map(toSummary);
  }

  async getWithGraph(
    id: string,
  ): Promise<TreeSummary & { persons: Person[]; relationships: Relationship[] }> {
    const tree = await this.repo.findByIdWithGraph(id);
    if (!tree) throw new NotFoundException(`Tree ${id} not found`);
    return {
      ...toSummary(tree),
      persons: tree.persons,
      relationships: tree.relationships,
    };
  }

  async update(id: string, dto: UpdateTreeDto): Promise<TreeSummary> {
    if (!(await this.repo.exists(id))) {
      throw new NotFoundException(`Tree ${id} not found`);
    }
    const tree = await this.repo.update(id, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
    });
    return toSummary(tree);
  }

  async delete(id: string): Promise<void> {
    if (!(await this.repo.exists(id))) {
      throw new NotFoundException(`Tree ${id} not found`);
    }
    await this.repo.delete(id);
  }
}
