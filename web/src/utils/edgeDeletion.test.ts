import { describe, expect, it } from 'vitest';
import type { Edge } from '@xyflow/react';
import type { Relationship } from '@/services/types';
import { relationshipIdsForEdge } from './edgeDeletion';

const pc = (id: string, source: string, target: string): Relationship => ({
  id,
  treeId: 't',
  sourcePersonId: source,
  targetPersonId: target,
  type: 'PARENT_CHILD',
  marriageDate: null,
  divorced: false,
  divorceDate: null,
  createdAt: '',
});

const sp = (id: string, source: string, target: string): Relationship => ({
  id,
  treeId: 't',
  sourcePersonId: source,
  targetPersonId: target,
  type: 'SPOUSE',
  marriageDate: null,
  divorced: false,
  divorceDate: null,
  createdAt: '',
});

describe('relationshipIdsForEdge', () => {
  it('returns the relationship id for a spouse edge', () => {
    const rels = [sp('r1', 'A', 'B')];
    const edge = { id: 'r1', source: 'A', target: 'B', type: 'spouse' } as Edge;
    expect(relationshipIdsForEdge(edge, rels)).toEqual(['r1']);
  });

  it('returns empty when the spouse edge id is unknown', () => {
    const edge = { id: 'rX', source: 'A', target: 'B', type: 'spouse' } as Edge;
    expect(relationshipIdsForEdge(edge, [])).toEqual([]);
  });

  it('returns all PARENT_CHILD rows from a parent to the family children', () => {
    // Family: parents {A,B}, children {C,D}. The edge from A to the union represents A's
    // parenthood of C and D — but NOT B's.
    const rels = [
      pc('r-ac', 'A', 'C'),
      pc('r-ad', 'A', 'D'),
      pc('r-bc', 'B', 'C'),
      pc('r-bd', 'B', 'D'),
    ];
    const edge = {
      id: 'e-A-union',
      source: 'A',
      target: 'union-A|B',
      type: 'parentChild',
      data: { kind: 'parent-of-family', parentId: 'A', childrenIds: ['C', 'D'] },
    } as Edge;
    expect(relationshipIdsForEdge(edge, rels).sort()).toEqual(['r-ac', 'r-ad']);
  });

  it('returns all PARENT_CHILD rows from the family parents to a single child', () => {
    const rels = [
      pc('r-ac', 'A', 'C'),
      pc('r-ad', 'A', 'D'),
      pc('r-bc', 'B', 'C'),
      pc('r-bd', 'B', 'D'),
    ];
    const edge = {
      id: 'e-union-C',
      source: 'union-A|B',
      target: 'C',
      type: 'parentChild',
      data: { kind: 'family-of-child', parentIds: ['A', 'B'], childId: 'C' },
    } as Edge;
    expect(relationshipIdsForEdge(edge, rels).sort()).toEqual(['r-ac', 'r-bc']);
  });

  it('returns empty for an unknown edge type', () => {
    const edge = { id: 'x', source: 'A', target: 'B', type: 'mystery' } as unknown as Edge;
    expect(relationshipIdsForEdge(edge, [])).toEqual([]);
  });

  it('returns empty for a parentChild edge with no data payload', () => {
    const edge = { id: 'e-A-u', source: 'A', target: 'u', type: 'parentChild' } as Edge;
    expect(relationshipIdsForEdge(edge, [])).toEqual([]);
  });
});
