import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadTreeExport, importIntoTree, importNewTree } from './importExport';

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

const payload = {
  version: 1 as const,
  tree: { title: 'T' },
  persons: [{ id: 'a', givenName: 'Ada' }],
  relationships: [],
};

describe('import services', () => {
  it('importNewTree POSTs to /trees/import', async () => {
    vi.stubGlobal('fetch', mockFetch(201, { id: 'new' }));
    await importNewTree(payload);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/trees/import'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('importIntoTree POSTs to /trees/:id/import', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { id: 't1' }));
    await importIntoTree('t1', payload);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/trees/t1/import'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('downloadTreeExport', () => {
  it('fetches the export and triggers a download', async () => {
    vi.stubGlobal('fetch', mockFetch(200, payload));
    const createUrl = vi.fn().mockReturnValue('blob:x');
    const revokeUrl = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: createUrl, revokeObjectURL: revokeUrl });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await downloadTreeExport('t1', 'My Tree');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/trees/t1/export'),
      expect.any(Object),
    );
    expect(createUrl).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeUrl).toHaveBeenCalled();
  });
});
