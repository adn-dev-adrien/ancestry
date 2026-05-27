import { exportPayloadSchema } from './import.dto';

const base = {
  version: 1,
  tree: { title: 'My family' },
  persons: [
    { id: 'a', givenName: 'Ada' },
    { id: 'b', givenName: 'Bob' },
  ],
  relationships: [{ sourcePersonId: 'a', targetPersonId: 'b', type: 'PARENT_CHILD' }],
};

describe('exportPayloadSchema', () => {
  it('accepts a well-formed payload', () => {
    expect(exportPayloadSchema.safeParse(base).success).toBe(true);
  });

  it('rejects an unsupported version', () => {
    expect(exportPayloadSchema.safeParse({ ...base, version: 2 }).success).toBe(false);
  });

  it('rejects a relationship referencing an unknown person id', () => {
    const payload = {
      ...base,
      relationships: [{ sourcePersonId: 'a', targetPersonId: 'ghost', type: 'SPOUSE' }],
    };
    expect(exportPayloadSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects a self-relationship', () => {
    const payload = {
      ...base,
      relationships: [{ sourcePersonId: 'a', targetPersonId: 'a', type: 'SPOUSE' }],
    };
    expect(exportPayloadSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects duplicate person ids', () => {
    const payload = {
      ...base,
      persons: [
        { id: 'a', givenName: 'Ada' },
        { id: 'a', givenName: 'Bob' },
      ],
      relationships: [],
    };
    expect(exportPayloadSchema.safeParse(payload).success).toBe(false);
  });
});
