import { describe, expect, it } from 'vitest';
import type { Person } from '@/services/types';
import { searchPersons } from './search';

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

const people = [
  person('1', { givenName: 'Ada', familyName: 'Lovelace' }),
  person('2', { givenName: 'Bob', familyName: 'Martin' }),
  person('3', { givenName: 'Charles', birthName: 'Adamson' }),
  person('4', { givenName: 'adele', familyName: 'Byron' }),
];

describe('searchPersons', () => {
  it('returns [] for an empty query', () => {
    expect(searchPersons(people, '   ')).toEqual([]);
  });

  it('matches case-insensitively on given/family/birth name', () => {
    const ids = searchPersons(people, 'ADA').map((p) => p.id);
    expect(ids).toContain('1'); // givenName Ada
    expect(ids).toContain('3'); // birthName Adamson
    expect(ids).not.toContain('2');
    expect(ids).not.toContain('4'); // "adele" does not contain "ada"
  });

  it('matches "ad" across given and birth names', () => {
    const ids = searchPersons(people, 'ad').map((p) => p.id);
    expect(ids.sort()).toEqual(['1', '3', '4']);
  });

  it('matches on family name', () => {
    expect(searchPersons(people, 'lovelace').map((p) => p.id)).toEqual(['1']);
  });

  it('matches on an additional given name', () => {
    const withExtra = [...people, person('5', { givenName: 'Bob', additionalGivenNames: 'Zorglub' })];
    expect(searchPersons(withExtra, 'zorg').map((p) => p.id)).toContain('5');
  });

  it('ranks prefix matches before mid-string matches', () => {
    // "ada": '1' (Ada), '4' (adele), '3' (Adamson) start with it; none are mid-only here,
    // so add a mid-string case.
    const withMid = [...people, person('5', { givenName: 'Wadane' })]; // contains "ada" mid-string
    const ids = searchPersons(withMid, 'ada').map((p) => p.id);
    expect(ids[ids.length - 1]).toBe('5');
  });

  it('respects the limit', () => {
    expect(searchPersons(people, 'a', 2)).toHaveLength(2);
  });
});
