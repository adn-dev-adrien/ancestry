import { api } from './api';
import type { Relationship, RelationshipType } from './types';

export const createRelationship = (
  treeId: string,
  body: { sourcePersonId: string; targetPersonId: string; type: RelationshipType },
) => api.post<Relationship>(`/trees/${treeId}/relationships`, body);

export const deleteRelationship = (relationshipId: string) =>
  api.delete(`/relationships/${relationshipId}`);
