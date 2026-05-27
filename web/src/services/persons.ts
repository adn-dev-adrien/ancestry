import { api } from './api';
import type { Gender, Person } from './types';

export interface PersonInput {
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

export const createPerson = (treeId: string, body: PersonInput) =>
  api.post<Person>(`/trees/${treeId}/persons`, body);

export const updatePerson = (personId: string, body: Partial<PersonInput>) =>
  api.patch<Person>(`/persons/${personId}`, body);

export const deletePerson = (personId: string) => api.delete(`/persons/${personId}`);
