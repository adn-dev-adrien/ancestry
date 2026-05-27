import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

const withCount = { _count: { select: { persons: true } } } satisfies Prisma.TreeInclude;

@Injectable()
export class TreesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { title: string; description: string | null }) {
    return this.prisma.tree.create({ data, include: withCount });
  }

  findManyWithCount() {
    return this.prisma.tree.findMany({
      orderBy: { updatedAt: 'desc' },
      include: withCount,
    });
  }

  findByIdWithGraph(id: string) {
    return this.prisma.tree.findUnique({
      where: { id },
      include: {
        ...withCount,
        persons: { orderBy: { createdAt: 'asc' } },
        relationships: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  update(id: string, data: Prisma.TreeUpdateInput) {
    return this.prisma.tree.update({ where: { id }, data, include: withCount });
  }

  delete(id: string) {
    return this.prisma.tree.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    return (await this.prisma.tree.count({ where: { id } })) > 0;
  }
}
