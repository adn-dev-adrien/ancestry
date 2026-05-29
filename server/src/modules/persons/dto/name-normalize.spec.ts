import { normalizeName } from './name-normalize';

describe('normalizeName', () => {
  it('lowercases then capitalizes single words', () => {
    expect(normalizeName('DURAND')).toBe('Durand');
    expect(normalizeName('marie')).toBe('Marie');
    expect(normalizeName('Durand')).toBe('Durand');
  });

  it('capitalizes after a hyphen', () => {
    expect(normalizeName('JEAN-PAUL')).toBe('Jean-Paul');
    expect(normalizeName('jean-paul')).toBe('Jean-Paul');
  });

  it('capitalizes after an apostrophe (straight or curly)', () => {
    expect(normalizeName("d'arc")).toBe("D'Arc");
    expect(normalizeName('d’arc')).toBe('D’Arc');
  });

  it('capitalizes after a space', () => {
    expect(normalizeName('marie jeanne joséphine')).toBe('Marie Jeanne Joséphine');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeName('  marie  ')).toBe('Marie');
  });

  it('preserves null, undefined and empty strings as-is', () => {
    expect(normalizeName(null)).toBeNull();
    expect(normalizeName(undefined)).toBeUndefined();
    expect(normalizeName('')).toBe('');
  });

  it('handles accented characters', () => {
    expect(normalizeName('éLODIE')).toBe('Élodie');
    expect(normalizeName('marie-éVE')).toBe('Marie-Éve');
  });
});
