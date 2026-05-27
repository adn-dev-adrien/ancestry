import { api } from './api';
import type { TreeSummary, TreeWithGraph } from './types';

export const listTrees = () => api.get<TreeSummary[]>('/trees');

export const getTree = (treeId: string) => api.get<TreeWithGraph>(`/trees/${treeId}`);

export const createTree = (body: { title: string; description?: string | null }) =>
  api.post<TreeSummary>('/trees', body);

export const updateTree = (
  treeId: string,
  body: { title?: string; description?: string | null },
) => api.patch<TreeSummary>(`/trees/${treeId}`, body);

export const deleteTree = (treeId: string) => api.delete(`/trees/${treeId}`);
