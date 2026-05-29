/**
 * Normalizes a person name so it looks like a proper name regardless of how it was typed:
 * trim, lowercase the whole string, then uppercase the first letter of every word using spaces,
 * hyphens and apostrophes as word separators.
 *
 *   DURAND               → Durand
 *   marie                → Marie
 *   JEAN-PAUL            → Jean-Paul
 *   d'arc                → D'Arc
 *   marie jeanne joséphine → Marie Jeanne Joséphine
 *
 * Empty strings, `null` and `undefined` are returned untouched (the field stays optional).
 */
export function normalizeName<T extends string | null | undefined>(value: T): T {
  if (value === null || value === undefined) return value;
  const trimmed = value.trim();
  if (trimmed === '') return value;
  const lower = trimmed.toLowerCase();
  // Capitalize at start and after any space, hyphen or apostrophe (curly apostrophe included).
  return lower.replace(/(^|[\s\-'’])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase()) as T;
}
