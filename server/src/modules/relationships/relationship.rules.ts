interface DirectedEdge {
  sourcePersonId: string;
  targetPersonId: string;
}

/**
 * Spouse relationships are undirected: persist and compare them by the
 * unordered pair, normalized as a sorted tuple so `{a,b}` and `{b,a}` collide.
 */
export function normalizeSpousePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Given the existing PARENT_CHILD edges (parent -> child) and a candidate edge
 * `parent -> child`, returns true if adding it would make a person its own
 * ancestor — i.e. `parent` is already a descendant of `child`.
 */
export function wouldCreateCycle(
  parentChildEdges: DirectedEdge[],
  parentId: string,
  childId: string,
): boolean {
  const childrenByParent = new Map<string, string[]>();
  for (const edge of parentChildEdges) {
    const list = childrenByParent.get(edge.sourcePersonId) ?? [];
    list.push(edge.targetPersonId);
    childrenByParent.set(edge.sourcePersonId, list);
  }

  // Walk down from the prospective child; reaching the prospective parent
  // means the parent is already below the child, so the new edge closes a loop.
  const stack = [childId];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (current === parentId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of childrenByParent.get(current) ?? []) {
      stack.push(next);
    }
  }
  return false;
}
