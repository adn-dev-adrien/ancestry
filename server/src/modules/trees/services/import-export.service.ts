import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TreesRepository } from '../repositories/trees.repository';
import { TreeSummary } from '../dto/tree.dto';
import { ExportPayload, ImportPerson } from '../dto/import.dto';

const EXPORT_VERSION = 1 as const;

@Injectable()
export class ImportExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trees: TreesRepository,
  ) {}

  async export(treeId: string): Promise<ExportPayload> {
    const tree = await this.trees.findByIdWithGraph(treeId);
    if (!tree) throw new NotFoundException(`Tree ${treeId} not found`);

    return {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      tree: { title: tree.title, description: tree.description },
      persons: tree.persons.map((p) => ({
        id: p.id,
        givenName: p.givenName,
        additionalGivenNames: p.additionalGivenNames,
        familyName: p.familyName,
        birthName: p.birthName,
        birthDate: p.birthDate,
        deathDate: p.deathDate,
        living: p.living,
        birthPlace: p.birthPlace,
        birthPlaceUncertain: p.birthPlaceUncertain,
        photo: p.photo,
        gender: p.gender,
        notes: p.notes,
        x: p.x,
        y: p.y,
      })),
      relationships: tree.relationships.map((r) => ({
        sourcePersonId: r.sourcePersonId,
        targetPersonId: r.targetPersonId,
        type: r.type,
        marriageDate: r.marriageDate,
        divorced: r.divorced,
        divorceDate: r.divorceDate,
      })),
    };
  }

  async importNew(payload: ExportPayload): Promise<TreeSummary> {
    return this.prisma.$transaction(async (tx) => {
      const tree = await tx.tree.create({
        data: { title: payload.tree.title, description: payload.tree.description ?? null },
      });
      await this.populate(tx, tree.id, payload);
      return this.summary(tree, payload.persons.length);
    });
  }

  async importReplace(treeId: string, payload: ExportPayload): Promise<TreeSummary> {
    if (!(await this.trees.exists(treeId))) {
      throw new NotFoundException(`Tree ${treeId} not found`);
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.person.deleteMany({ where: { treeId } });
      const tree = await tx.tree.update({
        where: { id: treeId },
        data: { title: payload.tree.title, description: payload.tree.description ?? null },
      });
      await this.populate(tx, tree.id, payload);
      return this.summary(tree, payload.persons.length);
    });
  }

  /** Creates persons (with fresh ids) then relationships, remapping file-local ids. */
  private async populate(
    tx: Prisma.TransactionClient,
    treeId: string,
    payload: ExportPayload,
  ): Promise<void> {
    const idMap = new Map<string, string>();
    payload.persons.forEach((p) => idMap.set(p.id, randomUUID()));

    if (payload.persons.length > 0) {
      await tx.person.createMany({
        data: payload.persons.map((p) => this.personRow(idMap.get(p.id) as string, treeId, p)),
      });
    }
    if (payload.relationships.length > 0) {
      await tx.relationship.createMany({
        data: payload.relationships.map((r) => ({
          treeId,
          sourcePersonId: idMap.get(r.sourcePersonId) as string,
          targetPersonId: idMap.get(r.targetPersonId) as string,
          type: r.type,
          marriageDate: r.marriageDate ?? null,
          divorced: r.divorced ?? false,
          divorceDate: r.divorceDate ?? null,
        })),
      });
    }
  }

  private personRow(
    id: string,
    treeId: string,
    p: ImportPerson,
  ): Prisma.PersonCreateManyInput {
    return {
      id,
      treeId,
      givenName: p.givenName,
      additionalGivenNames: p.additionalGivenNames ?? null,
      familyName: p.familyName ?? null,
      birthName: p.birthName ?? null,
      birthDate: p.birthDate ?? null,
      deathDate: p.deathDate ?? null,
      living: p.living ?? false,
      birthPlace: p.birthPlace ?? null,
      birthPlaceUncertain: p.birthPlaceUncertain ?? false,
      photo: p.photo ?? null,
      gender: p.gender ?? null,
      notes: p.notes ?? null,
      x: p.x ?? null,
      y: p.y ?? null,
    };
  }

  private summary(
    tree: { id: string; title: string; description: string | null; createdAt: Date; updatedAt: Date },
    personCount: number,
  ): TreeSummary {
    return {
      id: tree.id,
      title: tree.title,
      description: tree.description,
      createdAt: tree.createdAt,
      updatedAt: tree.updatedAt,
      personCount,
    };
  }
}
