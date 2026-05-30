export type UnionPositions = Record<string, { x: number; y: number }>;

const key = (treeId: string) => `ancestry.union.${treeId}`;

/** Manual positions of family junctions, kept per tree in localStorage (they are not DB entities). */
export function getUnionPositions(treeId: string): UnionPositions {
  try {
    return JSON.parse(localStorage.getItem(key(treeId)) || '{}') as UnionPositions;
  } catch {
    return {};
  }
}

export function saveUnionPosition(
  treeId: string,
  unionId: string,
  pos: { x: number; y: number },
): void {
  const all = getUnionPositions(treeId);
  all[unionId] = pos;
  try {
    localStorage.setItem(key(treeId), JSON.stringify(all));
  } catch {
    /* ignore quota/availability errors */
  }
}

/** Discards every saved union position for this tree (used by the auto-layout reset). */
export function clearUnionPositions(treeId: string): void {
  try {
    localStorage.removeItem(key(treeId));
  } catch {
    /* ignore quota/availability errors */
  }
}
