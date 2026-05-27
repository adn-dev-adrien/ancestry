import { Injectable, NotFoundException } from '@nestjs/common';
import { Relationship, RelationshipType } from '@prisma/client';
import { BusinessRuleException } from '../../../common/errors/business.exceptions';
import { RelationshipsRepository } from '../repositories/relationships.repository';
import { CreateRelationshipDto } from '../dto/relationship.dto';
import { normalizeSpousePair, wouldCreateCycle } from '../relationship.rules';

function samePair(
  rel: { sourcePersonId: string; targetPersonId: string },
  a: string,
  b: string,
): boolean {
  return (
    (rel.sourcePersonId === a && rel.targetPersonId === b) ||
    (rel.sourcePersonId === b && rel.targetPersonId === a)
  );
}

@Injectable()
export class RelationshipsService {
  constructor(private readonly repo: RelationshipsRepository) {}

  async create(treeId: string, dto: CreateRelationshipDto): Promise<Relationship> {
    const { sourcePersonId, targetPersonId, type } = dto;

    if (sourcePersonId === targetPersonId) {
      throw new BusinessRuleException(
        'SELF_RELATIONSHIP',
        'A person cannot have a relationship with themselves',
      );
    }

    const persons = await this.repo.findPersonsByIds([sourcePersonId, targetPersonId]);
    const source = persons.find((p) => p.id === sourcePersonId);
    const target = persons.find((p) => p.id === targetPersonId);
    if (!source || !target) {
      throw new NotFoundException('Source or target person not found');
    }
    if (source.treeId !== treeId || target.treeId !== treeId) {
      throw new BusinessRuleException(
        'CROSS_TREE_REFERENCE',
        'Both persons must belong to the tree',
      );
    }

    const treeRels = await this.repo.findByTree(treeId);
    const pairRels = treeRels.filter((r) => samePair(r, sourcePersonId, targetPersonId));

    const hasParentChildOnPair = pairRels.some((r) => r.type === RelationshipType.PARENT_CHILD);
    const hasSpouseOnPair = pairRels.some((r) => r.type === RelationshipType.SPOUSE);

    if (type === RelationshipType.SPOUSE) {
      if (hasParentChildOnPair) {
        throw new BusinessRuleException(
          'MIXED_RELATIONSHIP_PAIR',
          'A pair cannot be both parent-child and spouse',
        );
      }
      if (hasSpouseOnPair) {
        throw new BusinessRuleException(
          'DUPLICATE_RELATIONSHIP',
          'These persons are already spouses',
        );
      }
      const [a, b] = normalizeSpousePair(sourcePersonId, targetPersonId);
      return this.repo.create(treeId, { sourcePersonId: a, targetPersonId: b, type });
    }

    // PARENT_CHILD
    if (hasSpouseOnPair) {
      throw new BusinessRuleException(
        'MIXED_RELATIONSHIP_PAIR',
        'A pair cannot be both parent-child and spouse',
      );
    }
    const duplicateDirection = pairRels.some(
      (r) =>
        r.type === RelationshipType.PARENT_CHILD &&
        r.sourcePersonId === sourcePersonId &&
        r.targetPersonId === targetPersonId,
    );
    if (duplicateDirection) {
      throw new BusinessRuleException(
        'DUPLICATE_RELATIONSHIP',
        'This parent-child relationship already exists',
      );
    }

    const parentChildEdges = treeRels.filter((r) => r.type === RelationshipType.PARENT_CHILD);
    if (wouldCreateCycle(parentChildEdges, sourcePersonId, targetPersonId)) {
      throw new BusinessRuleException(
        'RELATIONSHIP_CYCLE',
        'This relationship would create a cycle in the parent graph',
      );
    }

    return this.repo.create(treeId, { sourcePersonId, targetPersonId, type });
  }

  async delete(id: string): Promise<void> {
    if (!(await this.repo.exists(id))) {
      throw new NotFoundException(`Relationship ${id} not found`);
    }
    await this.repo.delete(id);
  }
}
