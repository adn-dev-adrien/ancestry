const GEO_API = 'https://geo.api.gouv.fr/communes';

export interface Commune {
  nom: string;
  departement: string;
  codePostal: string | null;
}

interface GeoCommune {
  nom: string;
  departement?: { nom?: string };
  codesPostaux?: string[];
}

/**
 * Live lookup of French communes by name via the official geo.api.gouv.fr directory.
 * Returns [] on any non-OK response so callers can treat errors as "no suggestions".
 */
export async function searchCommunes(query: string, signal?: AbortSignal): Promise<Commune[]> {
  const params = new URLSearchParams({
    nom: query,
    fields: 'nom,departement,codesPostaux',
    boost: 'population',
    limit: '8',
  });

  let response: Response;
  try {
    response = await fetch(`${GEO_API}?${params.toString()}`, { signal });
  } catch {
    return [];
  }
  if (!response.ok) return [];

  const data = (await response.json().catch(() => [])) as GeoCommune[];
  return data.map((c) => ({
    nom: c.nom,
    departement: c.departement?.nom ?? '',
    codePostal: c.codesPostaux?.[0] ?? null,
  }));
}

/** Value stored in `birthPlace` when a suggestion is picked, e.g. "Lyon (Rhône)". */
export function communeLabel(commune: Commune): string {
  return commune.departement ? `${commune.nom} (${commune.departement})` : commune.nom;
}
