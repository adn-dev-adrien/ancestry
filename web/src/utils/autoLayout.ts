import type { Gender, Person, Relationship } from '@/services/types';
import { fullName } from './person';

export const NODE_WIDTH = 176;
export const NODE_HEIGHT = 76;
export const ROW_GAP = 120;
export const SPOUSE_GAP = 40;
export const SIBLING_GAP = 32;
export const FOREST_GAP = 120;

/**
 * Computes generation-aligned positions for every person in the tree so that:
 *  - each generation sits on its own row,
 *  - the woman is on the left of the man inside a couple (alphabetical tie-break),
 *  - children are centered under the midpoint of their parents,
 *  - a person with multiple marriages is rendered once, with their partners arranged
 *    chronologically around them (oldest anchor on the left, newest on the right).
 *
 * Pure: no React Flow / DOM dependency. Returns an absolute `{ x, y }` for every person.
 *
 * Approach:
 *  1. Resolve a "level" (generation) for every person via memoized parent-depth + spouse
 *     equalization, iterating to a fixed point.
 *  2. Group children by their parent set (a "family") and compute, per family, an anchor year
 *     (oldest shared child's birth year → marriage year → id-order fallback).
 *  3. Walk the forest of "spouse-and-co-parent clusters". A cluster groups everyone connected
 *     via SPOUSE links or via shared children, so a person remarried (or co-parenting) is
 *     rendered once with all their partners on the same row.
 *  4. Bottom-up: compute the width of every block. The gap between two adjacent parents in
 *     the row is widened to fit their shared children directly underneath them.
 *  5. Top-down: place each block, then place each family's children centered under the
 *     midpoint of that family's parents.
 */
export function autoLayout(
  persons: Person[],
  relationships: Relationship[],
): Map<string, { x: number; y: number }> {
  if (persons.length === 0) return new Map();

  const byId = new Map(persons.map((p) => [p.id, p]));
  const parentIds = new Map<string, string[]>();
  const childIds = new Map<string, string[]>();
  const spousesByPerson = new Map<string, { partner: string; rel: Relationship }[]>();

  for (const p of persons) {
    parentIds.set(p.id, []);
    childIds.set(p.id, []);
    spousesByPerson.set(p.id, []);
  }
  for (const r of relationships) {
    if (r.type === 'PARENT_CHILD') {
      parentIds.get(r.targetPersonId)?.push(r.sourcePersonId);
      childIds.get(r.sourcePersonId)?.push(r.targetPersonId);
    } else {
      spousesByPerson.get(r.sourcePersonId)?.push({ partner: r.targetPersonId, rel: r });
      spousesByPerson.get(r.targetPersonId)?.push({ partner: r.sourcePersonId, rel: r });
    }
  }

  // ---- 1. Levels ----
  const levels = computeLevels(persons, parentIds, spousesByPerson);

  // ---- 2. Families & anchor years ----
  const families = buildFamilies(persons, parentIds);
  for (const fam of families.values()) {
    fam.children.sort((a, b) => compareByBirthThenName(byId.get(a), byId.get(b)));
  }
  const familyAnchor = new Map<FamilyKey, number>();
  for (const fam of families.values()) {
    familyAnchor.set(fam.key, anchorYearOf(fam, byId, relationships));
  }

  // Co-parent links: two people share at least one family-as-parents (for non-spousal
  // co-parenting). Used during cluster BFS so they share the same row.
  const coParents = new Map<string, Set<string>>();
  for (const fam of families.values()) {
    if (fam.parents.length < 2) continue;
    for (const a of fam.parents) {
      for (const b of fam.parents) {
        if (a === b) continue;
        if (!coParents.has(a)) coParents.set(a, new Set());
        coParents.get(a)!.add(b);
      }
    }
  }

  // ---- 3. Recursively build blocks from forest roots ----
  const visited = new Set<string>();

  const buildBlock = (seedId: string): Block =>
    buildClusterBlock(seedId, {
      byId,
      parentIds,
      familyAnchor,
      families,
      spousesByPerson,
      coParents,
      levels,
      visited,
      buildBlock: (id: string) => buildBlock(id),
    });

  // Forest roots: persons with no parents in the data, sorted alphabetically. A cluster member
  // that's also a non-root (their spouse has parents) will be pulled in when we recurse, so we
  // don't need to start from them.
  const roots = persons
    .filter((p) => (parentIds.get(p.id)?.length ?? 0) === 0)
    .sort((a, b) => fullName(a).localeCompare(fullName(b), 'fr'))
    .map((p) => p.id);

  const blocks: Block[] = [];
  for (const id of roots) {
    if (!visited.has(id)) blocks.push(buildBlock(id));
  }
  // Anything still unvisited (rare: cycles defensively, or fully-disconnected persons whose
  // only link is to someone with parents) → place as their own block.
  for (const p of persons) {
    if (!visited.has(p.id)) blocks.push(buildBlock(p.id));
  }

  // ---- 4. Place blocks left-to-right at the forest level ----
  const positions = new Map<string, { x: number; y: number }>();
  let cursor = 0;
  for (const block of blocks) {
    placeBlock(block, cursor, positions);
    cursor += block.width + FOREST_GAP;
  }
  return positions;
}

// ---- Internal types ----

type FamilyKey = string;
interface Family {
  key: FamilyKey;
  parents: string[]; // sorted by id
  children: string[];
}

/** A block is one spouse-cluster row plus the child sub-blocks hanging under each family. */
interface Block {
  level: number;
  width: number;
  /** Local X (relative to block's left edge) for each person in the row. */
  rowX: Map<string, number>;
  /** Each cluster family with shared children: parent midpoint X + sub-blocks (ordered). */
  families: { midpointX: number; childBlocks: Block[]; childrenWidth: number }[];
}

interface BuildCtx {
  byId: Map<string, Person>;
  parentIds: Map<string, string[]>;
  familyAnchor: Map<FamilyKey, number>;
  families: Map<FamilyKey, Family>;
  spousesByPerson: Map<string, { partner: string }[]>;
  coParents: Map<string, Set<string>>;
  levels: Map<string, number>;
  visited: Set<string>;
  buildBlock: (id: string) => Block;
}

function buildClusterBlock(seedId: string, ctx: BuildCtx): Block {
  // 1. BFS the spouse + co-parent cluster from the seed (skip already-visited).
  const cluster = new Set<string>([seedId]);
  const queue = [seedId];
  while (queue.length > 0) {
    const p = queue.shift()!;
    const neighbors = new Set<string>();
    for (const { partner } of ctx.spousesByPerson.get(p) ?? []) neighbors.add(partner);
    for (const co of ctx.coParents.get(p) ?? []) neighbors.add(co);
    for (const n of neighbors) {
      if (!cluster.has(n) && !ctx.visited.has(n)) {
        cluster.add(n);
        queue.push(n);
      }
    }
  }
  for (const id of cluster) ctx.visited.add(id);

  // 2. Order cluster persons left-to-right.
  const rowPersons = orderCluster([...cluster], ctx);

  // 3. Families fully inside the cluster (every parent is a cluster member) — for each, build
  //    child sub-blocks in birth order.
  type ClusterFam = { fam: Family; parentIndices: number[]; childBlocks: Block[] };
  const clusterFamilies: ClusterFam[] = [];
  // Stable family iteration order to keep the layout deterministic.
  const sortedFamilies = [...ctx.families.values()].sort((a, b) => a.key.localeCompare(b.key));
  for (const fam of sortedFamilies) {
    if (!fam.parents.every((p) => cluster.has(p))) continue;
    const parentIndices = fam.parents
      .map((p) => rowPersons.indexOf(p))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
    const childBlocks: Block[] = [];
    for (const childId of fam.children) {
      if (ctx.visited.has(childId)) continue;
      childBlocks.push(ctx.buildBlock(childId));
    }
    clusterFamilies.push({ fam, parentIndices, childBlocks });
  }

  // 4. Compute row gaps so that each couple's children fit under their midpoint.
  const rowGaps: number[] = [];
  for (let i = 0; i < rowPersons.length - 1; i++) {
    let gap = SPOUSE_GAP;
    const adjacentFam = clusterFamilies.find(
      (f) => f.parentIndices.length === 2 && f.parentIndices[0] === i && f.parentIndices[1] === i + 1,
    );
    if (adjacentFam) {
      const cw = childrenGroupWidth(adjacentFam.childBlocks);
      if (cw > 0) gap = Math.max(gap, cw - 2 * NODE_WIDTH);
    }
    rowGaps.push(gap);
  }

  // 5. Tentative X positions in a local frame (leftmost person at x=0).
  const rowX = new Map<string, number>();
  let cx = 0;
  rowPersons.forEach((id, i) => {
    rowX.set(id, cx);
    cx += NODE_WIDTH;
    if (i < rowPersons.length - 1) cx += rowGaps[i];
  });
  const rowWidth = cx;

  // 6. For each family, compute its parent midpoint and its children's group width / extents.
  const familiesOut: Block['families'] = [];
  let leftExtent = 0;
  let rightExtent = rowWidth;
  for (const cf of clusterFamilies) {
    if (cf.childBlocks.length === 0) continue;
    const cw = childrenGroupWidth(cf.childBlocks);
    const midpointX = parentMidpointX(cf.parentIndices, rowPersons, rowX);
    leftExtent = Math.min(leftExtent, midpointX - cw / 2);
    rightExtent = Math.max(rightExtent, midpointX + cw / 2);
    familiesOut.push({ midpointX, childBlocks: cf.childBlocks, childrenWidth: cw });
  }

  // 7. Shift the local frame so leftExtent = 0; the block's width = rightExtent - leftExtent.
  const shift = -leftExtent;
  if (shift !== 0) {
    for (const [id, x] of rowX) rowX.set(id, x + shift);
    for (const fam of familiesOut) fam.midpointX += shift;
  }
  const width = rightExtent - leftExtent;
  const level = ctx.levels.get(seedId) ?? 0;

  return { level, width, rowX, families: familiesOut };
}

function placeBlock(
  block: Block,
  leftX: number,
  positions: Map<string, { x: number; y: number }>,
): void {
  const rowY = block.level * (NODE_HEIGHT + ROW_GAP);
  for (const [id, x] of block.rowX) positions.set(id, { x: leftX + x, y: rowY });
  for (const fam of block.families) {
    const childGroupLeft = leftX + fam.midpointX - fam.childrenWidth / 2;
    let cursor = childGroupLeft;
    for (const child of fam.childBlocks) {
      placeBlock(child, cursor, positions);
      cursor += child.width + SIBLING_GAP;
    }
  }
}

function childrenGroupWidth(childBlocks: Block[]): number {
  if (childBlocks.length === 0) return 0;
  return (
    childBlocks.reduce((s, b) => s + b.width, 0) + (childBlocks.length - 1) * SIBLING_GAP
  );
}

function parentMidpointX(
  parentIndices: number[],
  rowPersons: string[],
  rowX: Map<string, number>,
): number {
  if (parentIndices.length === 0) return 0;
  const centers = parentIndices.map((i) => (rowX.get(rowPersons[i]) ?? 0) + NODE_WIDTH / 2);
  return centers.reduce((s, c) => s + c, 0) / centers.length;
}

// ---- Levels ----

function computeLevels(
  persons: Person[],
  parentIds: Map<string, string[]>,
  spousesByPerson: Map<string, { partner: string }[]>,
): Map<string, number> {
  const levels = new Map<string, number>();
  const seen = new Set<string>();
  const visit = (id: string): number => {
    if (levels.has(id)) return levels.get(id)!;
    if (seen.has(id)) return 0; // defensive — server forbids cycles
    seen.add(id);
    const parents = parentIds.get(id) ?? [];
    const lvl = parents.length === 0 ? 0 : Math.max(...parents.map(visit)) + 1;
    levels.set(id, lvl);
    return lvl;
  };
  for (const p of persons) visit(p.id);

  // Fixed-point: spouse equalization can lift one partner up, which then forces the descent
  // chain to follow via PARENT_CHILD. Both rules are monotone (levels only increase) so this
  // terminates in O(N) outer iterations.
  let changed = true;
  while (changed) {
    changed = false;
    for (const [id, partners] of spousesByPerson) {
      const myLvl = levels.get(id) ?? 0;
      for (const { partner } of partners) {
        const lift = Math.max(myLvl, levels.get(partner) ?? 0);
        if ((levels.get(id) ?? 0) < lift) {
          levels.set(id, lift);
          changed = true;
        }
        if ((levels.get(partner) ?? 0) < lift) {
          levels.set(partner, lift);
          changed = true;
        }
      }
    }
    for (const p of persons) {
      const parents = parentIds.get(p.id) ?? [];
      if (parents.length === 0) continue;
      const needed = Math.max(...parents.map((pid) => levels.get(pid) ?? 0)) + 1;
      if ((levels.get(p.id) ?? 0) < needed) {
        levels.set(p.id, needed);
        changed = true;
      }
    }
  }
  return levels;
}

// ---- Families ----

function buildFamilies(persons: Person[], parentIds: Map<string, string[]>): Map<FamilyKey, Family> {
  const families = new Map<FamilyKey, Family>();
  for (const p of persons) {
    const parents = parentIds.get(p.id) ?? [];
    if (parents.length === 0) continue;
    const sortedParents = [...new Set(parents)].sort();
    const key = sortedParents.join('|');
    const fam = families.get(key) ?? { key, parents: sortedParents, children: [] };
    fam.children.push(p.id);
    families.set(key, fam);
  }
  return families;
}

// ---- Anchor year ----

function anchorYearOf(
  family: Family,
  byId: Map<string, Person>,
  relationships: Relationship[],
): number {
  let min: number | null = null;
  for (const c of family.children) {
    const y = birthYearOf(byId.get(c));
    if (y !== null && (min === null || y < min)) min = y;
  }
  if (min !== null) return min;
  if (family.parents.length === 2) {
    const [a, b] = family.parents;
    const rel = relationships.find(
      (r) =>
        r.type === 'SPOUSE' &&
        ((r.sourcePersonId === a && r.targetPersonId === b) ||
          (r.sourcePersonId === b && r.targetPersonId === a)),
    );
    if (rel?.marriageDate) {
      const y = parseInt(rel.marriageDate.slice(0, 4), 10);
      if (Number.isFinite(y)) return y;
    }
  }
  // Stable fallback: small hash of the family key so ordering stays deterministic.
  let h = 0;
  for (let i = 0; i < family.key.length; i++) h = (h * 31 + family.key.charCodeAt(i)) | 0;
  return h;
}

function birthYearOf(p: Person | undefined): number | null {
  if (!p?.birthDate) return null;
  const y = parseInt(p.birthDate.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function compareByBirthThenName(a: Person | undefined, b: Person | undefined): number {
  const ya = birthYearOf(a);
  const yb = birthYearOf(b);
  if (ya !== null && yb !== null && ya !== yb) return ya - yb;
  if (ya === null && yb !== null) return 1;
  if (ya !== null && yb === null) return -1;
  return (a ? fullName(a) : '').localeCompare(b ? fullName(b) : '', 'fr');
}

// ---- Cluster ordering ----

/**
 * Orders the persons of a spouse-cluster left-to-right per the spec rules:
 *  - Size 1: just the person.
 *  - Size 2: F-left M-right; alphabetical tie-break (unknown gender sits to the right of F,
 *    to the left of M).
 *  - Size ≥ 3: find the "central" person (highest degree in the cluster). Their partners (in
 *    the cluster) are sorted by their couple's anchor year (oldest first). The N–1 oldest go
 *    to the left of the central in order; the newest goes to the right.
 */
function orderCluster(cluster: string[], ctx: BuildCtx): string[] {
  if (cluster.length === 1) return cluster;
  if (cluster.length === 2) {
    const [a, b] = cluster;
    return orderCouple(a, b, ctx.byId);
  }
  // Pick the central person: highest "cluster degree" (spouse + co-parent neighbors that
  // belong to this cluster). Ties broken by id for stability.
  const clusterSet = new Set(cluster);
  const degree = (id: string) => {
    let d = 0;
    for (const { partner } of ctx.spousesByPerson.get(id) ?? []) if (clusterSet.has(partner)) d++;
    for (const co of ctx.coParents.get(id) ?? []) if (clusterSet.has(co)) d++;
    return d;
  };
  const central = [...cluster].sort((a, b) => {
    const dd = degree(b) - degree(a);
    return dd !== 0 ? dd : a.localeCompare(b);
  })[0];

  // Partners of the central in this cluster, sorted by the couple's anchor year.
  const partnerKeys = new Map<string, FamilyKey | null>();
  for (const id of cluster) {
    if (id === central) continue;
    // The family they share with `central` (if any).
    const sharedKey = [...ctx.families.values()].find(
      (f) =>
        f.parents.length === 2 &&
        f.parents.includes(central) &&
        f.parents.includes(id),
    )?.key;
    partnerKeys.set(id, sharedKey ?? null);
  }
  const anchorOf = (id: string): number => {
    const k = partnerKeys.get(id);
    return k ? (ctx.familyAnchor.get(k) ?? 0) : 0;
  };
  const partners = [...cluster]
    .filter((id) => id !== central)
    .sort((a, b) => {
      const dd = anchorOf(a) - anchorOf(b);
      return dd !== 0 ? dd : a.localeCompare(b);
    });

  // N≥3: place partners[0..N-2] left of central; partners[N-1] right of central.
  return [...partners.slice(0, -1), central, partners[partners.length - 1]];
}

function orderCouple(a: string, b: string, byId: Map<string, Person>): [string, string] {
  const pa = byId.get(a);
  const pb = byId.get(b);
  const ga: Gender | null = pa?.gender ?? null;
  const gb: Gender | null = pb?.gender ?? null;
  if (ga === 'FEMALE' && gb !== 'FEMALE') return [a, b];
  if (gb === 'FEMALE' && ga !== 'FEMALE') return [b, a];
  // F is exhausted by now. If exactly one is MALE → unknown on the left, MALE on the right.
  if (ga === 'MALE' && gb !== 'MALE') return [b, a];
  if (gb === 'MALE' && ga !== 'MALE') return [a, b];
  // Same gender (both F handled above, so here either both M or both unknown) → alphabetical.
  const cmp = (pa ? fullName(pa) : '').localeCompare(pb ? fullName(pb) : '', 'fr');
  return cmp <= 0 ? [a, b] : [b, a];
}
