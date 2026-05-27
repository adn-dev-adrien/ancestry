import { describe, expect, it } from 'vitest';
import type { Relationship } from '@/services/types';
import { childrenOf, parentsOf, spousesOf } from './relationships';

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

const fixture: Relationship[] = [
  rel('r1', 'A', 'B', 'PARENT_CHILD'),
  rel('r2', 'A', 'C', 'PARENT_CHILD'),
  rel('r3', 'B', 'D', 'SPOUSE'),
];

describe('relationship derivations', () => {
  it('parentsOf returns sources of parent-child edges to the person', () => {
    expect(parentsOf('B', fixture)).toEqual(['A']);
    expect(parentsOf('A', fixture)).toEqual([]);
  });

  it('childrenOf returns targets of parent-child edges from the person', () => {
    expect(childrenOf('A', fixture)).toEqual(['B', 'C']);
  });

  it('spousesOf returns the other side regardless of direction', () => {
    expect(spousesOf('B', fixture)).toEqual(['D']);
    expect(spousesOf('D', fixture)).toEqual(['B']);
  });
});
