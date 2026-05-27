import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateRelationship } from './relationships';

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

afterEach(() => vi.restoreAllMocks());

describe('updateRelationship', () => {
  it('PATCHes the marriage fields to /relationships/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { id: 'r1' }));

    await updateRelationship('r1', { marriageDate: '1990-06-01', divorced: true, divorceDate: '2005-03-02' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/relationships/r1'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ marriageDate: '1990-06-01', divorced: true, divorceDate: '2005-03-02' }),
      }),
    );
  });
});
