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
