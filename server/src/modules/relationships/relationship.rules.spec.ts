import { normalizeSpousePair, wouldCreateCycle } from './relationship.rules';

describe('normalizeSpousePair', () => {
  it('sorts the pair so order does not matter', () => {
    expect(normalizeSpousePair('b', 'a')).toEqual(['a', 'b']);
    expect(normalizeSpousePair('a', 'b')).toEqual(['a', 'b']);
  });
});

describe('wouldCreateCycle', () => {
  const edges = [
    { sourcePersonId: 'A', targetPersonId: 'B' },
    { sourcePersonId: 'B', targetPersonId: 'C' },
  ];

  it('detects a closing edge (C -> A over A -> B -> C)', () => {
    expect(wouldCreateCycle(edges, 'C', 'A')).toBe(true);
  });

  it('detects a direct back edge (B -> A)', () => {
    expect(wouldCreateCycle(edges, 'B', 'A')).toBe(true);
  });

  it('allows a non-cyclic edge (A -> D)', () => {
    expect(wouldCreateCycle(edges, 'A', 'D')).toBe(false);
  });

  it('allows a second parent for a child (D -> C)', () => {
    expect(wouldCreateCycle(edges, 'D', 'C')).toBe(false);
  });
});
