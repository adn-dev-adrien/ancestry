import { updateRelationshipSchema } from './relationship.dto';

describe('updateRelationshipSchema', () => {
  it('accepts a lone marriage date', () => {
    expect(updateRelationshipSchema.safeParse({ marriageDate: '1990-06-01' }).success).toBe(true);
  });

  it('accepts divorced with a divorce date on/after the marriage', () => {
    const result = updateRelationshipSchema.safeParse({
      marriageDate: '1990-06-01',
      divorced: true,
      divorceDate: '2005-03-02',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a divorce date earlier than the marriage date', () => {
    expect(
      updateRelationshipSchema.safeParse({
        marriageDate: '1990-06-01',
        divorced: true,
        divorceDate: '1980-01-01',
      }).success,
    ).toBe(false);
  });

  it('rejects a divorce date when not divorced', () => {
    expect(
      updateRelationshipSchema.safeParse({ divorced: false, divorceDate: '2005-03-02' }).success,
    ).toBe(false);
  });
});
