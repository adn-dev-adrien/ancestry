import { Gender } from '@prisma/client';
import { z } from 'zod';
import { normalizeName } from './name-normalize';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date as YYYY-MM-DD');

// Name fields are stored normalized (proper-case after every word break) regardless of how the
// user typed them — the rule applies to every entry path (form, import) thanks to the transform.
const requiredName = z.string().trim().min(1).max(100).transform(normalizeName);
const optionalName = z
  .string()
  .max(100)
  .nullable()
  .optional()
  .transform((v) => normalizeName(v));
const optionalLongName = z
  .string()
  .max(200)
  .nullable()
  .optional()
  .transform((v) => normalizeName(v));

export const personFieldsSchema = z
  .object({
    givenName: requiredName,
    additionalGivenNames: optionalLongName,
    familyName: optionalName,
    birthName: optionalName,
    birthDate: isoDate.nullable().optional(),
    deathDate: isoDate.nullable().optional(),
    living: z.boolean().optional(),
    birthPlace: z.string().max(200).nullable().optional(),
    birthPlaceUncertain: z.boolean().optional(),
    deathPlace: z.string().max(200).nullable().optional(),
    deathPlaceUncertain: z.boolean().optional(),
    photo: z
      .string()
      .regex(/^data:image\/(jpeg|png|webp);base64,/, 'Expected an image data URL')
      .max(1_500_000)
      .nullable()
      .optional(),
    gender: z.nativeEnum(Gender).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
    x: z.number().finite().nullable().optional(),
    y: z.number().finite().nullable().optional(),
  })
  .strict();

// A living person cannot also carry a death date (rejected at the boundary as 400).
const livingRule = {
  message: 'A living person cannot have a death date',
  path: ['deathDate'],
};

export const createPersonSchema = personFieldsSchema.refine(
  (d) => !(d.living === true && d.deathDate),
  livingRule,
);
export const updatePersonSchema = personFieldsSchema
  .partial()
  .refine((d) => !(d.living === true && d.deathDate), livingRule);

export type CreatePersonDto = z.infer<typeof createPersonSchema>;
export type UpdatePersonDto = z.infer<typeof updatePersonSchema>;
