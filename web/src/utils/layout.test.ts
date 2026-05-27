import { describe, expect, it } from 'vitest';
import type { Person, Relationship } from '@/services/types';
import { buildGraph } from './layout';

const person = (id: string, over: Partial<Person> = {}): Person => ({
  id,
  treeId: 't',
  givenName: id,
  familyName: null,
  birthName: null,
  birthDate: null,
  deathDate: null,
  living: false,
  birthPlace: null,
  birthPlaceUncertain: false,
  photo: null,
  gender: null,
  notes: null,
  x: null,
  y: null,
  createdAt: '',
  updatedAt: '',
  ...over,
});

const rel = (
  id: string,
  source: string,
  target: string,
  type: Relationship['type'],
): Relationship => ({
  id,
  treeId: 't',
  sourcePersonId: source,
  targetPersonId: target,
  type,
  createdAt: '',
});

describe('buildGraph', () => {
  it('returns a node per person and an edge per relationship', () => {
    const persons = [person('A'), person('B'), person('C')];
    const relationships = [rel('r1', 'A', 'B', 'PARENT_CHILD'), rel('r2', 'B', 'C', 'SPOUSE')];

    const { nodes, edges } = buildGraph(persons, relationships);

    expect(nodes).toHaveLength(3);
    expect(edges).toHaveLength(2);
    const parentChild = edges.find((e) => e.id === 'r1');
    const spouse = edges.find((e) => e.id === 'r2');
    expect(parentChild?.type).toBe('parentChild');
    expect(parentChild?.markerEnd).toBeDefined();
    expect(spouse?.type).toBe('spouse');
    expect(spouse?.style?.strokeDasharray).toBe('6 4');
  });

  it('honors stored x/y over the dagre layout', () => {
    const persons = [person('A', { x: 500, y: 320 })];
    const { nodes } = buildGraph(persons, []);
    expect(nodes[0].position).toEqual({ x: 500, y: 320 });
  });

  it('falls back to a computed position when x/y are absent', () => {
    const persons = [person('A')];
    const { nodes } = buildGraph(persons, []);
    expect(typeof nodes[0].position.x).toBe('number');
    expect(typeof nodes[0].position.y).toBe('number');
  });
});
