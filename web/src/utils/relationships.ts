import type { Relationship } from '@/services/types';

export function parentsOf(personId: string, relationships: Relationship[]): string[] {
  return relationships
    .filter((r) => r.type === 'PARENT_CHILD' && r.targetPersonId === personId)
    .map((r) => r.sourcePersonId);
}

export function childrenOf(personId: string, relationships: Relationship[]): string[] {
  return relationships
    .filter((r) => r.type === 'PARENT_CHILD' && r.sourcePersonId === personId)
    .map((r) => r.targetPersonId);
}

export function spousesOf(personId: string, relationships: Relationship[]): string[] {
  return relationships
    .filter(
      (r) =>
        r.type === 'SPOUSE' &&
        (r.sourcePersonId === personId || r.targetPersonId === personId),
    )
    .map((r) => (r.sourcePersonId === personId ? r.targetPersonId : r.sourcePersonId));
}

/** Spouse relationship rows for a person, with the partner's id resolved. */
export function spouseRelationships(
  personId: string,
  relationships: Relationship[],
): { relationship: Relationship; partnerId: string }[] {
  return relationships
    .filter(
      (r) =>
        r.type === 'SPOUSE' &&
        (r.sourcePersonId === personId || r.targetPersonId === personId),
    )
    .map((r) => ({
      relationship: r,
      partnerId: r.sourcePersonId === personId ? r.targetPersonId : r.sourcePersonId,
    }));
}
