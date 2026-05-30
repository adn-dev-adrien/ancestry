import type { Edge } from '@xyflow/react';
import type { Relationship } from '@/services/types';

/** Discriminated payload attached to parent-child edges by `buildGraph`. */
export type ParentChildEdgeData =
  | { kind: 'parent-of-family'; parentId: string; childrenIds: string[] }
  | { kind: 'family-of-child'; parentIds: string[]; childId: string };

/**
 * Resolves an edge to the underlying `Relationship` ids whose deletion the user is asking for.
 *
 * - Spouse edges carry the relationship id as `edge.id` → returns `[edge.id]` (if it exists).
 * - Parent → union edges carry `{ parentId, childrenIds }` → returns every PARENT_CHILD row
 *   where `source = parentId` and `target ∈ childrenIds` (that parent's parenthood of every
 *   child of the family).
 * - Union → child edges carry `{ parentIds, childId }` → returns every PARENT_CHILD row where
 *   `target = childId` and `source ∈ parentIds` (that child's link to all parents of the family).
 *
 * Unknown edge types return an empty array (no-op deletion).
 */
export function relationshipIdsForEdge(edge: Edge, relationships: Relationship[]): string[] {
  if (edge.type === 'spouse') {
    return relationships.some((r) => r.id === edge.id) ? [edge.id] : [];
  }

  if (edge.type !== 'parentChild') return [];
  const data = edge.data as ParentChildEdgeData | undefined;
  if (!data) return [];

  if (data.kind === 'parent-of-family') {
    const childSet = new Set(data.childrenIds);
    return relationships
      .filter(
        (r) =>
          r.type === 'PARENT_CHILD' &&
          r.sourcePersonId === data.parentId &&
          childSet.has(r.targetPersonId),
      )
      .map((r) => r.id);
  }

  // family-of-child
  const parentSet = new Set(data.parentIds);
  return relationships
    .filter(
      (r) =>
        r.type === 'PARENT_CHILD' &&
        r.targetPersonId === data.childId &&
        parentSet.has(r.sourcePersonId),
    )
    .map((r) => r.id);
}
