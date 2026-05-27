import { z } from 'zod';

export const createTreeSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(2000).nullable().optional(),
  })
  .strict();

export const updateTreeSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
  })
  .strict();

export type CreateTreeDto = z.infer<typeof createTreeSchema>;
export type UpdateTreeDto = z.infer<typeof updateTreeSchema>;

export interface TreeSummary {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  personCount: number;
}
