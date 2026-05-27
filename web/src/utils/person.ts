import type { Person } from '@/services/types';

export function fullName(person: Person): string {
  // Family part: show whichever name is set; when both exist, show the family
  // (used) name followed by the birth name in parentheses.
  const family =
    person.familyName && person.birthName
      ? `${person.familyName} (${person.birthName})`
      : person.familyName || person.birthName || '';
  return [person.givenName, family].filter(Boolean).join(' ');
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
