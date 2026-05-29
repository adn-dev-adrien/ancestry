import dagre from 'dagre';
import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { Person, Relationship } from '@/services/types';
import type { UnionPositions } from './unionPositions';

export const NODE_WIDTH = 176;
export const NODE_HEIGHT = 76;
export const UNION_SIZE = 20;

export interface PersonNodeData extends Record<string, unknown> {
  person: Person;
}

export type PersonNode = Node<PersonNodeData, 'person'>;

interface Family {
  key: string;
  parents: string[];
  children: string[];
}

/** Groups parent-child rows into families keyed by the (sorted) parent set. */
function buildFamilies(relationships: Relationship[]): Family[] {
  const parentsByChild = new Map<string, string[]>();
  for (const r of relationships) {
    if (r.type !== 'PARENT_CHILD') continue;
    const arr = parentsByChild.get(r.targetPersonId) ?? [];
    arr.push(r.sourcePersonId);
    parentsByChild.set(r.targetPersonId, arr);
  }

  const families = new Map<string, Family>();
  for (const [child, parents] of parentsByChild) {
    const sorted = [...new Set(parents)].sort();
    const key = sorted.join('|');
    const fam = families.get(key) ?? { key, parents: sorted, children: [] };
    fam.children.push(child);
    families.set(key, fam);
  }
  return [...families.values()];
}

const unionId = (key: string) => `union-${key}`;

/**
 * Lays out the graph top-to-bottom with dagre. Parent-child links are routed through a small
 * "union" junction per family (a parent set and its children): parents connect to the union and a
 * single connector fans out to all the children — the "family bus". A person's stored x/y overrides
 * the computed position so manual drags persist.
 */
export function buildGraph(
  persons: Person[],
  relationships: Relationship[],
  unionPositions: UnionPositions = {},
): { nodes: Node[]; edges: Edge[] } {
  const families = buildFamilies(relationships);

  const graph = new dagre.graphlib.Graph();
  // Smaller ranksep: the extra union rank between generations keeps spacing natural.
  graph.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 40 });
  graph.setDefaultEdgeLabel(() => ({}));

  persons.forEach((p) => graph.setNode(p.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  for (const fam of families) {
    const uid = unionId(fam.key);
    graph.setNode(uid, { width: UNION_SIZE, height: UNION_SIZE });
    fam.parents.forEach((pid) => graph.setEdge(pid, uid));
    fam.children.forEach((cid) => graph.setEdge(uid, cid));
  }

  dagre.layout(graph);

  const personNodes: PersonNode[] = persons.map((person) => {
    const laid = graph.node(person.id);
    const x = person.x ?? (laid ? laid.x - NODE_WIDTH / 2 : 0);
    const y = person.y ?? (laid ? laid.y - NODE_HEIGHT / 2 : 0);
    return { id: person.id, type: 'person', position: { x, y }, data: { person } };
  });

  const posById = new Map(personNodes.map((n) => [n.id, n.position]));

  const unionNodes: Node[] = families.map((fam) => {
    const uid = unionId(fam.key);

    // Center the junction between the actual (possibly stored) parent/child positions, so a
    // newly created link sits between the two nodes — not where dagre would put it if persons
    // had been manually moved. A saved manual junction position still wins.
    const parents = fam.parents
      .map((pid) => posById.get(pid))
      .filter((p): p is { x: number; y: number } => Boolean(p));
    const children = fam.children
      .map((cid) => posById.get(cid))
      .filter((p): p is { x: number; y: number } => Boolean(p));

    let computed: { x: number; y: number };
    if (parents.length > 0 && children.length > 0) {
      const avgParentCenterX =
        parents.reduce((s, p) => s + p.x + NODE_WIDTH / 2, 0) / parents.length;
      const parentBottomY = Math.max(...parents.map((p) => p.y + NODE_HEIGHT));
      const childTopY = Math.min(...children.map((p) => p.y));
      computed = {
        x: avgParentCenterX - UNION_SIZE / 2,
        y: (parentBottomY + childTopY) / 2 - UNION_SIZE / 2,
      };
    } else {
      const laid = graph.node(uid);
      computed = {
        x: (laid?.x ?? 0) - UNION_SIZE / 2,
        y: (laid?.y ?? 0) - UNION_SIZE / 2,
      };
    }

    return {
      id: uid,
      type: 'union',
      position: unionPositions[uid] ?? computed,
      data: {},
      draggable: true,
      selectable: false,
    };
  });

  const edges: Edge[] = [];

  for (const fam of families) {
    const uid = unionId(fam.key);
    fam.parents.forEach((pid) =>
      edges.push({
        id: `e-${pid}-${uid}`,
        source: pid,
        target: uid,
        sourceHandle: 'pc-source',
        targetHandle: 'union-target',
        type: 'parentChild',
      }),
    );
    fam.children.forEach((cid) =>
      edges.push({
        id: `e-${uid}-${cid}`,
        source: uid,
        target: cid,
        sourceHandle: 'union-source',
        targetHandle: 'pc-target',
        type: 'parentChild',
        markerEnd: { type: MarkerType.ArrowClosed },
      }),
    );
  }

  for (const r of relationships) {
    if (r.type !== 'SPOUSE') continue;
    // Horizontal spouse link: leave the right side of the left node, enter the left side of the right node.
    const sourceLeft =
      (posById.get(r.sourcePersonId)?.x ?? 0) <= (posById.get(r.targetPersonId)?.x ?? 0);
    const leftId = sourceLeft ? r.sourcePersonId : r.targetPersonId;
    const rightId = sourceLeft ? r.targetPersonId : r.sourcePersonId;
    edges.push({
      id: r.id,
      source: leftId,
      target: rightId,
      sourceHandle: 'spouse-right',
      targetHandle: 'spouse-left',
      type: 'spouse',
      data: { divorced: r.divorced, marriageDate: r.marriageDate },
    });
  }

  return { nodes: [...personNodes, ...unionNodes], edges };
}
