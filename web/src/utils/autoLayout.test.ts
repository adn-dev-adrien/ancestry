import { describe, expect, it } from 'vitest';
import type { Gender, Person, Relationship } from '@/services/types';
import { autoLayout, FOREST_GAP, NODE_WIDTH, ROW_GAP, SPOUSE_GAP } from './autoLayout';
import { NODE_HEIGHT } from './layout';

const person = (
  id: string,
  over: Partial<Person> & { givenName?: string; gender?: Gender | null } = {},
): Person => ({
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

const sp = (
  id: string,
  source: string,
  target: string,
  over: Partial<Relationship> = {},
): Relationship => ({
  id,
  treeId: 't',
  sourcePersonId: source,
  targetPersonId: target,
  type: 'SPOUSE',
  marriageDate: null,
  divorced: false,
  divorceDate: null,
  createdAt: '',
  ...over,
});

const ROW_DELTA = NODE_HEIGHT + ROW_GAP;

describe('autoLayout', () => {
  it('returns an empty map for an empty input', () => {
    expect(autoLayout([], [])).toEqual(new Map());
  });

  it('places persons of the same generation on the same row', () => {
    const persons = [
      person('father', { gender: 'MALE' }),
      person('mother', { gender: 'FEMALE' }),
      person('kid1', { givenName: 'Anna', birthDate: '1990-01-01' }),
      person('kid2', { givenName: 'Bert', birthDate: '1992-01-01' }),
    ];
    const rels = [
      sp('s1', 'father', 'mother'),
      pc('r1', 'father', 'kid1'),
      pc('r2', 'mother', 'kid1'),
      pc('r3', 'father', 'kid2'),
      pc('r4', 'mother', 'kid2'),
    ];
    const pos = autoLayout(persons, rels);
    expect(pos.get('father')!.y).toBe(0);
    expect(pos.get('mother')!.y).toBe(0);
    expect(pos.get('kid1')!.y).toBe(ROW_DELTA);
    expect(pos.get('kid2')!.y).toBe(ROW_DELTA);
  });

  it('places the female on the left of the male in a couple', () => {
    const persons = [
      person('m', { gender: 'MALE', givenName: 'Marc' }),
      person('f', { gender: 'FEMALE', givenName: 'Fanny' }),
    ];
    const pos = autoLayout(persons, [sp('s1', 'm', 'f')]);
    expect(pos.get('f')!.x).toBeLessThan(pos.get('m')!.x);
  });

  it('respects spouse gap between two members of a couple', () => {
    const persons = [
      person('m', { gender: 'MALE' }),
      person('f', { gender: 'FEMALE' }),
    ];
    const pos = autoLayout(persons, [sp('s1', 'm', 'f')]);
    expect(pos.get('m')!.x - pos.get('f')!.x).toBe(NODE_WIDTH + SPOUSE_GAP);
  });

  it('falls back to alphabetical when both partners share a gender', () => {
    const persons = [
      person('p1', { gender: 'FEMALE', givenName: 'Brice' }),
      person('p2', { gender: 'FEMALE', givenName: 'Alice' }),
    ];
    const pos = autoLayout(persons, [sp('s1', 'p1', 'p2')]);
    // Alice (A) before Brice (B) → Alice on the left
    expect(pos.get('p2')!.x).toBeLessThan(pos.get('p1')!.x);
  });

  it('places children centered under the midpoint of their parents', () => {
    const persons = [
      person('father', { gender: 'MALE' }),
      person('mother', { gender: 'FEMALE' }),
      person('kid1', { birthDate: '1990-01-01' }),
      person('kid2', { birthDate: '1992-01-01' }),
    ];
    const rels = [
      sp('s1', 'father', 'mother'),
      pc('r1', 'father', 'kid1'),
      pc('r2', 'mother', 'kid1'),
      pc('r3', 'father', 'kid2'),
      pc('r4', 'mother', 'kid2'),
    ];
    const pos = autoLayout(persons, rels);
    const parentMid =
      (pos.get('father')!.x + NODE_WIDTH / 2 + pos.get('mother')!.x + NODE_WIDTH / 2) / 2;
    const childMid =
      (pos.get('kid1')!.x + NODE_WIDTH / 2 + pos.get('kid2')!.x + NODE_WIDTH / 2) / 2;
    expect(childMid).toBe(parentMid);
  });

  it('orders siblings by birth date (oldest first)', () => {
    const persons = [
      person('p', { gender: 'FEMALE' }),
      person('young', { birthDate: '2010-01-01', givenName: 'Zoe' }),
      person('old', { birthDate: '1990-01-01', givenName: 'Anna' }),
      person('mid', { birthDate: '2000-01-01', givenName: 'Mia' }),
    ];
    const rels = [pc('r1', 'p', 'old'), pc('r2', 'p', 'young'), pc('r3', 'p', 'mid')];
    const pos = autoLayout(persons, rels);
    expect(pos.get('old')!.x).toBeLessThan(pos.get('mid')!.x);
    expect(pos.get('mid')!.x).toBeLessThan(pos.get('young')!.x);
  });

  it('places a married-in spouse on the same row as their partner', () => {
    // Marie has no parents in the tree (root). She married Pierre (also root). Spouse rule
    // should place them on the same row even though they have no shared anchor.
    const persons = [
      person('pierre', { gender: 'MALE', givenName: 'Pierre' }),
      person('marie', { gender: 'FEMALE', givenName: 'Marie' }),
    ];
    const pos = autoLayout(persons, [sp('s1', 'pierre', 'marie')]);
    expect(pos.get('pierre')!.y).toBe(pos.get('marie')!.y);
  });

  it('lifts a married-in spouse to their partner descendant level (fixed point)', () => {
    // gp (grand-parent) → p (parent) → kid. kid marries `spouse` who has no parents in data.
    // Spouse should sit on kid's row (level 2), not level 0.
    const persons = [
      person('gp'),
      person('p'),
      person('kid'),
      person('spouse'),
    ];
    const rels = [
      pc('r1', 'gp', 'p'),
      pc('r2', 'p', 'kid'),
      sp('s1', 'kid', 'spouse'),
    ];
    const pos = autoLayout(persons, rels);
    expect(pos.get('kid')!.y).toBe(pos.get('spouse')!.y);
    expect(pos.get('kid')!.y).toBe(2 * ROW_DELTA);
  });

  it('arranges multiple marriages chronologically around the shared person', () => {
    // Pierre married Marie (kid Anna, born 1990) then Sophie (kid Marc, born 2010).
    // Expected row order: Marie – Pierre – Sophie (Marie older anchor → leftmost).
    const persons = [
      person('pierre', { gender: 'MALE', givenName: 'Pierre' }),
      person('marie', { gender: 'FEMALE', givenName: 'Marie' }),
      person('sophie', { gender: 'FEMALE', givenName: 'Sophie' }),
      person('anna', { givenName: 'Anna', birthDate: '1990-01-01' }),
      person('marc', { givenName: 'Marc', birthDate: '2010-01-01' }),
    ];
    const rels = [
      sp('s1', 'pierre', 'marie'),
      sp('s2', 'pierre', 'sophie'),
      pc('r1', 'pierre', 'anna'),
      pc('r2', 'marie', 'anna'),
      pc('r3', 'pierre', 'marc'),
      pc('r4', 'sophie', 'marc'),
    ];
    const pos = autoLayout(persons, rels);
    expect(pos.get('marie')!.x).toBeLessThan(pos.get('pierre')!.x);
    expect(pos.get('pierre')!.x).toBeLessThan(pos.get('sophie')!.x);
    expect(pos.get('marie')!.y).toBe(pos.get('sophie')!.y);
  });

  it('uses the marriage year as anchor when a couple has no children yet', () => {
    // Pierre married Marie in 1990 (no kids yet), then Sophie in 2010 (with kid Marc).
    // Chronology should still place Marie left, Sophie right.
    const persons = [
      person('pierre', { gender: 'MALE' }),
      person('marie', { gender: 'FEMALE' }),
      person('sophie', { gender: 'FEMALE' }),
      person('marc', { birthDate: '2011-01-01' }),
    ];
    const rels = [
      sp('s1', 'pierre', 'marie', { marriageDate: '1990-06-01' }),
      sp('s2', 'pierre', 'sophie', { marriageDate: '2010-06-01' }),
      pc('r1', 'pierre', 'marc'),
      pc('r2', 'sophie', 'marc'),
    ];
    const pos = autoLayout(persons, rels);
    expect(pos.get('marie')!.x).toBeLessThan(pos.get('pierre')!.x);
    expect(pos.get('pierre')!.x).toBeLessThan(pos.get('sophie')!.x);
  });

  it('places disjoint forests side-by-side at the top row', () => {
    const persons = [
      person('a', { givenName: 'Alice' }),
      person('z', { givenName: 'Zoe' }),
    ];
    const pos = autoLayout(persons, []);
    expect(pos.get('a')!.y).toBe(0);
    expect(pos.get('z')!.y).toBe(0);
    expect(pos.get('z')!.x - pos.get('a')!.x).toBe(NODE_WIDTH + FOREST_GAP);
  });

  it('centers grand-parents above the children-couple, themselves above grand-children', () => {
    // Three generations: gpA & gpB → mother. mother marries father (root). They have kid.
    const persons = [
      person('gpA', { gender: 'FEMALE' }),
      person('gpB', { gender: 'MALE' }),
      person('mother', { gender: 'FEMALE' }),
      person('father', { gender: 'MALE' }),
      person('kid'),
    ];
    const rels = [
      sp('s1', 'gpA', 'gpB'),
      pc('r1', 'gpA', 'mother'),
      pc('r2', 'gpB', 'mother'),
      sp('s2', 'mother', 'father'),
      pc('r3', 'mother', 'kid'),
      pc('r4', 'father', 'kid'),
    ];
    const pos = autoLayout(persons, rels);
    expect(pos.get('gpA')!.y).toBe(0);
    expect(pos.get('mother')!.y).toBe(ROW_DELTA);
    expect(pos.get('kid')!.y).toBe(2 * ROW_DELTA);
    // kid is centered between mother & father (which is the natural rule here).
    const parentMid =
      (pos.get('mother')!.x + NODE_WIDTH / 2 + pos.get('father')!.x + NODE_WIDTH / 2) / 2;
    expect(pos.get('kid')!.x + NODE_WIDTH / 2).toBe(parentMid);
  });
});
