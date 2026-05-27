import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api';
import { createTree, listTrees } from './trees';

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('api services', () => {
  it('listTrees performs a GET and returns the parsed body', async () => {
    const trees = [{ id: 't1', title: 'A' }];
    vi.stubGlobal('fetch', mockFetch(200, trees));

    const result = await listTrees();

    expect(result).toEqual(trees);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/trees'),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('createTree POSTs the body', async () => {
    vi.stubGlobal('fetch', mockFetch(201, { id: 't2', title: 'B' }));

    await createTree({ title: 'B' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/trees'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: 'B' }) }),
    );
  });

  it('throws an ApiError carrying the structured error body', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(409, { statusCode: 409, message: 'Duplicate', code: 'DUPLICATE_RELATIONSHIP' }),
    );

    await expect(listTrees()).rejects.toMatchObject({
      status: 409,
      body: { code: 'DUPLICATE_RELATIONSHIP' },
    });
    await expect(listTrees()).rejects.toBeInstanceOf(ApiError);
  });
});
