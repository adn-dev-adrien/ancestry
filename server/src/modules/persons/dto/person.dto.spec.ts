import { createPersonSchema, updatePersonSchema } from './person.dto';

describe('createPersonSchema', () => {
  it('rejects a living person carrying a death date', () => {
    const result = createPersonSchema.safeParse({
      givenName: 'Ada',
      living: true,
      deathDate: '2000-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a living person without a death date', () => {
    const result = createPersonSchema.safeParse({ givenName: 'Ada', living: true });
    expect(result.success).toBe(true);
  });

  it('accepts the new optional fields', () => {
    const result = createPersonSchema.safeParse({
      givenName: 'Ada',
      birthName: 'Byron',
      birthPlace: 'London',
      birthPlaceUncertain: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid image data URL as photo', () => {
    const result = createPersonSchema.safeParse({
      givenName: 'Ada',
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-image photo string', () => {
    expect(
      createPersonSchema.safeParse({ givenName: 'Ada', photo: 'https://example.com/x.jpg' }).success,
    ).toBe(false);
  });

  it('rejects an oversized photo', () => {
    const huge = 'data:image/png;base64,' + 'A'.repeat(1_500_001);
    expect(createPersonSchema.safeParse({ givenName: 'Ada', photo: huge }).success).toBe(false);
  });

  it('accepts deathPlace + deathPlaceUncertain', () => {
    const result = createPersonSchema.safeParse({
      givenName: 'Ada',
      deathPlace: 'London',
      deathPlaceUncertain: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a deathPlace over 200 chars', () => {
    expect(
      createPersonSchema.safeParse({ givenName: 'Ada', deathPlace: 'x'.repeat(201) }).success,
    ).toBe(false);
  });

  it('normalizes name fields (lowercase + capitalize after separators)', () => {
    const parsed = createPersonSchema.parse({
      givenName: 'JEAN-PAUL',
      additionalGivenNames: 'marie joséphine',
      familyName: "d'arc",
      birthName: 'DURAND',
    });
    expect(parsed.givenName).toBe('Jean-Paul');
    expect(parsed.additionalGivenNames).toBe('Marie Joséphine');
    expect(parsed.familyName).toBe("D'Arc");
    expect(parsed.birthName).toBe('Durand');
  });
});

describe('updatePersonSchema', () => {
  it('rejects living + death date on a patch payload', () => {
    expect(
      updatePersonSchema.safeParse({ living: true, deathDate: '2000-01-01' }).success,
    ).toBe(false);
  });
});
