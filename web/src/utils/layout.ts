import dagre from 'dagre';
import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { Person, Relationship } from '@/services/types';

export const NODE_WIDTH = 176;
export const NODE_HEIGHT = 76;

export interface PersonNodeData extends Record<string, unknown> {
  person: Person;
}

export type PersonNode = Node<PersonNodeData, 'person'>;

/**
 * Lays out the graph top-to-bottom with dagre using the PARENT_CHILD edges.
 * A person's stored x/y overrides the computed position so manual drags persist.
 */
export function buildGraph(
  persons: Person[],
  relationships: Relationship[],
): { nodes: PersonNode[]; edges: Edge[] } {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 80 });
  graph.setDefaultEdgeLabel(() => ({}));

  persons.forEach((p) => graph.setNode(p.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  relationships
    .filter((r) => r.type === 'PARENT_CHILD')
    .forEach((r) => graph.setEdge(r.sourcePersonId, r.targetPersonId));

  dagre.layout(graph);

  const nodes: PersonNode[] = persons.map((person) => {
    const laid = graph.node(person.id);
    const x = person.x ?? (laid ? laid.x - NODE_WIDTH / 2 : 0);
    const y = person.y ?? (laid ? laid.y - NODE_HEIGHT / 2 : 0);
    return {
      id: person.id,
      type: 'person',
      position: { x, y },
      data: { person },
    };
  });

  const posById = new Map(nodes.map((n) => [n.id, n.position]));

  const edges: Edge[] = relationships.map((r) => {
    if (r.type === 'PARENT_CHILD') {
      return {
        id: r.id,
        source: r.sourcePersonId,
        target: r.targetPersonId,
        sourceHandle: 'pc-source',
        targetHandle: 'pc-target',
        type: 'parentChild',
        markerEnd: { type: MarkerType.ArrowClosed },
      };
    }

    // Spouse links are horizontal: connect the inner vertical sides of the two nodes.
    // Pick which person is on the left so the edge leaves a right side and enters a left side.
    const sourceLeft =
      (posById.get(r.sourcePersonId)?.x ?? 0) <= (posById.get(r.targetPersonId)?.x ?? 0);
    const leftId = sourceLeft ? r.sourcePersonId : r.targetPersonId;
    const rightId = sourceLeft ? r.targetPersonId : r.sourcePersonId;
    return {
      id: r.id,
      source: leftId,
      target: rightId,
      sourceHandle: 'spouse-right',
      targetHandle: 'spouse-left',
      type: 'spouse',
      data: { divorced: r.divorced, marriageDate: r.marriageDate },
    };
  });

  return { nodes, edges };
}
