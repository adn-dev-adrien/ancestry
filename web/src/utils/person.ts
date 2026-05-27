import type { Person } from '@/services/types';

export function fullName(person: Person): string {
  return [person.givenName, person.familyName].filter(Boolean).join(' ');
}

function year(date: string | null): string | null {
  return date ? date.slice(0, 4) : null;
}

/** "1952 – 1998", "b. 1952", "d. 1998" or "" when no dates are set. */
export function lifeSpan(person: Person): string {
  const birth = year(person.birthDate);
  const death = year(person.deathDate);
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return `b. ${birth}`;
  if (death) return `d. ${death}`;
  return '';
}
