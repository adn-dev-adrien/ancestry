import type { Person } from '@/services/types';
import { fullName } from './person';

/**
 * Case-insensitive substring search over a person's given/family/birth names.
 * Prefix matches (a field starting with the query) rank before other substring
 * matches; ties break alphabetically by full name. Returns at most `limit` persons.
 */
export function searchPersons(persons: Person[], query: string, limit = 8): Person[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: { person: Person; prefix: boolean }[] = [];
  for (const person of persons) {
    const fields = [person.givenName, person.familyName, person.birthName].filter(
      (v): v is string => Boolean(v),
    );
    const haystacks = fields.map((f) => f.toLowerCase());
    const matches = haystacks.some((h) => h.includes(q));
    if (!matches) continue;
    const prefix = haystacks.some((h) => h.startsWith(q));
    scored.push({ person, prefix });
  }

  scored.sort((a, b) => {
    if (a.prefix !== b.prefix) return a.prefix ? -1 : 1;
    return fullName(a.person).localeCompare(fullName(b.person));
  });

  return scored.slice(0, limit).map((s) => s.person);
}
