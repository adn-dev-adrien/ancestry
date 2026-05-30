import { describe, expect, it } from 'vitest';
import type { Person, Relationship } from '@/services/types';
import { buildGraph } from './layout';

const person = (id: string, over: Partial<Person> = {}): Person => ({
  id,
  treeId: 't',
  givenName: id,
  additionalGivenNames: null,
  familyName: null,
  birthName: null,
  birthDate: null,
  deathDate: null,
  living: false,
  birthPlace: null,
  birthPlaceUncertain: false,
  deathPlace: null,
  deathPlaceUncertain: false,
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
  marriageDate: null,
  divorced: false,
  divorceDate: null,
  createdAt: '',
});

describe('buildGraph', () => {
  it('routes a couple and their children through one union (family bus)', () => {
    const persons = [person('A'), person('B'), person('C'), person('D')];
    const relationships = [
      rel('r1', 'A', 'C', 'PARENT_CHILD'),
      rel('r2', 'B', 'C', 'PARENT_CHILD'),
      rel('r3', 'A', 'D', 'PARENT_CHILD'),
      rel('r4', 'B', 'D', 'PARENT_CHILD'),
    ];

    const { nodes, edges } = buildGraph(persons, relationships);

    const unions = nodes.filter((n) => n.type === 'union');
    expect(unions).toHaveLength(1);
    const uid = unions[0].id;

    // Both parents connect into the union; one connector fans out to each child.
    const parentEdges = edges.filter((e) => e.target === uid);
    const childEdges = edges.filter((e) => e.source === uid);
    expect(parentEdges.map((e) => e.source).sort()).toEqual(['A', 'B']);
    expect(childEdges.map((e) => e.target).sort()).toEqual(['C', 'D']);
    childEdges.forEach((e) => expect(e.markerEnd).toBeDefined());

    // No direct person→person parent-child edge remains.
    expect(edges.some((e) => e.type === 'parentChild' && e.source === 'A' && e.target === 'C')).toBe(
      false,
    );
    // Junctions are draggable (to reposition the bus) but not selectable (no panel).
    expect(unions[0].selectable).toBe(false);
    expect(unions[0].draggable).toBe(true);

    // Parent → union edges carry the data needed to resolve a deletion (this parent's parenthood
    // of every child of the family).
    const parentA = edges.find((e) => e.source === 'A' && e.target === uid);
    expect(parentA?.data).toEqual({
      kind: 'parent-of-family',
      parentId: 'A',
      childrenIds: ['C', 'D'],
    });
    // Union → child edges carry the data to resolve a deletion (every parent of the family for
    // that child).
    const childC = edges.find((e) => e.source === uid && e.target === 'C');
    expect(childC?.data).toEqual({
      kind: 'family-of-child',
      parentIds: ['A', 'B'],
      childId: 'C',
    });
  });

  it('uses a saved manual position for a union when provided', () => {
    const persons = [person('A'), person('B')];
    const rels = [rel('r1', 'A', 'B', 'PARENT_CHILD')];
    const unionIdValue = buildGraph(persons, rels).nodes.find((n) => n.type === 'union')!.id;
    const { nodes } = buildGraph(persons, rels, { [unionIdValue]: { x: 999, y: 42 } });
    const union = nodes.find((n) => n.type === 'union');
    expect(union?.position).toEqual({ x: 999, y: 42 });
  });

  it('still creates a union for a single parent', () => {
    const { nodes, edges } = buildGraph(
      [person('A'), person('B')],
      [rel('r1', 'A', 'B', 'PARENT_CHILD')],
    );
    const union = nodes.find((n) => n.type === 'union');
    expect(union).toBeDefined();
    expect(edges.filter((e) => e.target === union!.id)).toHaveLength(1);
    expect(edges.filter((e) => e.source === union!.id)).toHaveLength(1);
  });

  it('creates no union when there are no parent-child links', () => {
    const { nodes } = buildGraph([person('A')], []);
    expect(nodes.filter((n) => n.type === 'union')).toHaveLength(0);
  });

  it('keeps spouse links horizontal with their badge data', () => {
    const { edges } = buildGraph(
      [person('A'), person('B')],
      [rel('r1', 'A', 'B', 'SPOUSE')],
    );
    const spouse = edges.find((e) => e.id === 'r1');
    expect(spouse?.type).toBe('spouse');
    expect(spouse?.data?.divorced).toBe(false);
    expect(spouse?.sourceHandle).toBe('spouse-right');
    expect(spouse?.targetHandle).toBe('spouse-left');
  });

  it('honors stored x/y over the dagre layout', () => {
    const { nodes } = buildGraph([person('A', { x: 500, y: 320 })], []);
    expect(nodes[0].position).toEqual({ x: 500, y: 320 });
  });

  it('falls back to a computed position when x/y are absent', () => {
    const { nodes } = buildGraph([person('A')], []);
    expect(typeof nodes[0].position.x).toBe('number');
    expect(typeof nodes[0].position.y).toBe('number');
  });
});
