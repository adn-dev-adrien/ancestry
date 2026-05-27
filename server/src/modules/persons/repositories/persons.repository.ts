import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class PersonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(treeId: string, data: Omit<Prisma.PersonCreateInput, 'tree'>) {
    return this.prisma.person.create({
      data: { ...data, tree: { connect: { id: treeId } } },
    });
  }

  findById(id: string) {
    return this.prisma.person.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.PersonUpdateInput) {
    return this.prisma.person.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.person.delete({ where: { id } });
  }

  async treeExists(treeId: string): Promise<boolean> {
    return (await this.prisma.tree.count({ where: { id: treeId } })) > 0;
  }
}
