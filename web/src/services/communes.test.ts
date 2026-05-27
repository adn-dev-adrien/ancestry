import { afterEach, describe, expect, it, vi } from 'vitest';
import { communeLabel, searchCommunes } from './communes';

afterEach(() => vi.restoreAllMocks());

describe('searchCommunes', () => {
  it('queries the geo API and maps the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { nom: 'Lyon', departement: { nom: 'Rhône' }, codesPostaux: ['69001', '69002'] },
        ]),
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await searchCommunes('lyon');

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('https://geo.api.gouv.fr/communes');
    expect(url).toContain('nom=lyon');
    expect(result).toEqual([{ nom: 'Lyon', departement: 'Rhône', codePostal: '69001' }]);
  });

  it('returns [] on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false } as Response));
    expect(await searchCommunes('xyz')).toEqual([]);
  });

  it('returns [] when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await searchCommunes('lyon')).toEqual([]);
  });
});

describe('communeLabel', () => {
  it('formats name and department', () => {
    expect(communeLabel({ nom: 'Lyon', departement: 'Rhône', codePostal: '69001' })).toBe(
      'Lyon (Rhône)',
    );
  });

  it('falls back to the name when no department', () => {
    expect(communeLabel({ nom: 'Ailleurs', departement: '', codePostal: null })).toBe('Ailleurs');
  });
});
