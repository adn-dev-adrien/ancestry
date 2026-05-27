import { RelationshipType } from '@prisma/client';
import { z } from 'zod';
import { personFieldsSchema } from '../../persons/dto/person.dto';

const importPersonSchema = personFieldsSchema.extend({
  id: z.string().min(1),
});

const importRelationshipSchema = z.object({
  sourcePersonId: z.string().min(1),
  targetPersonId: z.string().min(1),
  type: z.nativeEnum(RelationshipType),
  marriageDate: z.string().nullable().optional(),
  divorced: z.boolean().optional(),
  divorceDate: z.string().nullable().optional(),
});

export const exportPayloadSchema = z
  .object({
    version: z.literal(1),
    exportedAt: z.string().optional(),
    tree: z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().max(2000).nullable().optional(),
    }),
    persons: z.array(importPersonSchema),
    relationships: z.array(importRelationshipSchema),
  })
  .strict()
  .superRefine((payload, ctx) => {
    const ids = new Set(payload.persons.map((p) => p.id));
    if (ids.size !== payload.persons.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate person id in file', path: ['persons'] });
    }
    payload.relationships.forEach((rel, index) => {
      if (rel.sourcePersonId === rel.targetPersonId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A relationship cannot reference the same person twice',
          path: ['relationships', index],
        });
      }
      if (!ids.has(rel.sourcePersonId) || !ids.has(rel.targetPersonId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Relationship references an unknown person id',
          path: ['relationships', index],
        });
      }
    });
  });

export type ExportPayload = z.infer<typeof exportPayloadSchema>;
export type ImportPerson = z.infer<typeof importPersonSchema>;
