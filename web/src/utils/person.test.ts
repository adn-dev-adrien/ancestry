import { describe, expect, it } from 'vitest';
import type { Person } from '@/services/types';
import { fullName } from './person';

const person = (over: Partial<Person> = {}): Person => ({
  id: 'p1',
  treeId: 't',
  givenName: 'Ada',
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

describe('fullName', () => {
  it('shows the family name when only it is set', () => {
    expect(fullName(person({ familyName: 'Lovelace' }))).toBe('Ada Lovelace');
  });

  it('shows the birth name when only it is set', () => {
    expect(fullName(person({ birthName: 'Byron' }))).toBe('Ada Byron');
  });

  it('shows family name then birth name in parentheses when both are set', () => {
    expect(fullName(person({ familyName: 'Lovelace', birthName: 'Byron' }))).toBe(
      'Ada Lovelace (Byron)',
    );
  });

  it('is just the given name when no family or birth name', () => {
    expect(fullName(person())).toBe('Ada');
  });
});
