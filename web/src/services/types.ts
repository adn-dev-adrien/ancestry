export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type RelationshipType = 'PARENT_CHILD' | 'SPOUSE';

export interface TreeSummary {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  personCount: number;
}

export interface Person {
  id: string;
  treeId: string;
  givenName: string;
  familyName: string | null;
  birthName: string | null;
  birthDate: string | null;
  deathDate: string | null;
  living: boolean;
  birthPlace: string | null;
  birthPlaceUncertain: boolean;
  gender: Gender | null;
  notes: string | null;
  x: number | null;
  y: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  treeId: string;
  sourcePersonId: string;
  targetPersonId: string;
  type: RelationshipType;
  createdAt: string;
}

export interface TreeWithGraph extends TreeSummary {
  persons: Person[];
  relationships: Relationship[];
}
