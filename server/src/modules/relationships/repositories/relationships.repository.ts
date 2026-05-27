import { Injectable } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class RelationshipsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPersonsByIds(ids: string[]) {
    return this.prisma.person.findMany({
      where: { id: { in: ids } },
      select: { id: true, treeId: true },
    });
  }

  findByTree(treeId: string) {
    return this.prisma.relationship.findMany({
      where: { treeId },
      select: { id: true, sourcePersonId: true, targetPersonId: true, type: true },
    });
  }

  create(treeId: string, data: {
    sourcePersonId: string;
    targetPersonId: string;
    type: RelationshipType;
  }) {
    return this.prisma.relationship.create({
      data: {
        type: data.type,
        tree: { connect: { id: treeId } },
        source: { connect: { id: data.sourcePersonId } },
        target: { connect: { id: data.targetPersonId } },
      },
    });
  }

  delete(id: string) {
    return this.prisma.relationship.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    return (await this.prisma.relationship.count({ where: { id } })) > 0;
  }
}
