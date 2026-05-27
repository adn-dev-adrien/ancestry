import { api } from './api';
import type { Gender, RelationshipType, TreeSummary } from './types';

export interface ExportPerson {
  id: string;
  givenName: string;
  familyName?: string | null;
  birthName?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  living?: boolean;
  birthPlace?: string | null;
  birthPlaceUncertain?: boolean;
  gender?: Gender | null;
  notes?: string | null;
  x?: number | null;
  y?: number | null;
}

export interface ExportPayload {
  version: 1;
  exportedAt?: string;
  tree: { title: string; description?: string | null };
  persons: ExportPerson[];
  relationships: { sourcePersonId: string; targetPersonId: string; type: RelationshipType }[];
}

export const getExport = (treeId: string) => api.get<ExportPayload>(`/trees/${treeId}/export`);

export const importNewTree = (payload: ExportPayload) =>
  api.post<TreeSummary>('/trees/import', payload);

export const importIntoTree = (treeId: string, payload: ExportPayload) =>
  api.post<TreeSummary>(`/trees/${treeId}/import`, payload);

function sanitizeFilename(name: string): string {
  const cleaned = name.trim().replace(/[^a-z0-9\-_]+/gi, '-').replace(/^-+|-+$/g, '');
  return (cleaned || 'tree').toLowerCase();
}

/** Fetches the export payload for a tree and triggers a JSON file download. */
export async function downloadTreeExport(treeId: string, title: string): Promise<void> {
  const payload = await getExport(treeId);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${sanitizeFilename(title)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
