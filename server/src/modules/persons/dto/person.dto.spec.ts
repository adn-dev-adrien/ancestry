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
});

describe('updatePersonSchema', () => {
  it('rejects living + death date on a patch payload', () => {
    expect(
      updatePersonSchema.safeParse({ living: true, deathDate: '2000-01-01' }).success,
    ).toBe(false);
  });
});
