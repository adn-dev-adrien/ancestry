import { api } from './api';
import type { Relationship, RelationshipType } from './types';

export const createRelationship = (
  treeId: string,
  body: { sourcePersonId: string; targetPersonId: string; type: RelationshipType },
) => api.post<Relationship>(`/trees/${treeId}/relationships`, body);

export interface MarriageInput {
  marriageDate?: string | null;
  divorced?: boolean;
  divorceDate?: string | null;
}

export const updateRelationship = (relationshipId: string, body: MarriageInput) =>
  api.patch<Relationship>(`/relationships/${relationshipId}`, body);

export const deleteRelationship = (relationshipId: string) =>
  api.delete(`/relationships/${relationshipId}`);
