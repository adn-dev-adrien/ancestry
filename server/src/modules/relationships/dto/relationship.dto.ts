import { RelationshipType } from '@prisma/client';
import { z } from 'zod';

export const createRelationshipSchema = z
  .object({
    sourcePersonId: z.string().uuid(),
    targetPersonId: z.string().uuid(),
    type: z.nativeEnum(RelationshipType),
  })
  .strict();

export type CreateRelationshipDto = z.infer<typeof createRelationshipSchema>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date as YYYY-MM-DD');

export const updateRelationshipSchema = z
  .object({
    marriageDate: isoDate.nullable().optional(),
    divorced: z.boolean().optional(),
    divorceDate: isoDate.nullable().optional(),
  })
  .strict()
  .refine((d) => !(d.marriageDate && d.divorceDate) || d.divorceDate >= d.marriageDate, {
    message: 'Divorce date must be on or after the marriage date',
    path: ['divorceDate'],
  })
  .refine((d) => !(d.divorceDate && d.divorced === false), {
    message: 'A divorce date requires the marriage to be marked divorced',
    path: ['divorceDate'],
  });

export type UpdateRelationshipDto = z.infer<typeof updateRelationshipSchema>;
