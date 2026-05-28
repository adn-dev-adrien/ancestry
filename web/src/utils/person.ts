import type { Person } from '@/services/types';

// Family part: show whichever name is set; when both exist, show the family
// (used) name followed by the birth name in parentheses.
function familyPart(person: Person): string {
  return person.familyName && person.birthName
    ? `${person.familyName} (${person.birthName})`
    : person.familyName || person.birthName || '';
}

/** Name shown on the graph node: the primary given name + family part. */
export function fullName(person: Person): string {
  return [person.givenName, familyPart(person)].filter(Boolean).join(' ');
}

/** All first names (primary + additional), e.g. "Marie Jeanne Joséphine". */
export function allGivenNames(person: Person): string {
  return [person.givenName, person.additionalGivenNames].filter(Boolean).join(' ');
}

/** Label used in search results: all first names + family part. */
export function searchLabel(person: Person): string {
  return [allGivenNames(person), familyPart(person)].filter(Boolean).join(' ');
}

function year(date: string | null): string | null {
  return date ? date.slice(0, 4) : null;
}

/**
 * "1952 – 1998", "{born} 1952", "{death} 1998" or "" when no dates are set.
 * Prefixes are passed in so the caller can localize them.
 */
export function lifeSpan(
  person: Person,
  prefixes: { born: string; death: string },
): string {
  const birth = year(person.birthDate);
  const death = year(person.deathDate);
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return `${prefixes.born} ${birth}`;
  if (death) return `${prefixes.death} ${death}`;
  return '';
}
