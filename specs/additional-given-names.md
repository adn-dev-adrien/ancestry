# Additional given names

## Status
Implemented

## Context
A person currently has a single given name, which is also what shows on the graph. People often
have several first names (e.g. "Marie Jeanne Joséphine"). We let the user record those extra first
names on the person, **without** changing what is shown on the node — they live only in the person
form (the "fiche").

## Goal
A person can store additional first names (free text). They are editable in the person form, persist
and travel with export/import, but the node/graph display is unchanged (still the primary given name).

## Functional rules
- `Person` gains an optional `additionalGivenNames` (free text, 0–200 chars). `null`/empty = none.
- The primary `givenName` is unchanged and remains the only first name shown on the **graph node**
  and in `fullName` (no display change on the canvas).
- The field is shown and editable in the person form, right under "Given name".
- **Search** matches against the additional first names too (in addition to given/family/birth name),
  and search result rows **display all first names** (primary + additional) so the user sees the full
  first names — e.g. "Marie Jeanne Joséphine Dupont".
- Included in JSON export and restored on import (like the other person fields).
- Existing persons get `additionalGivenNames = null` via the migration default.

## Architecture

### Server
- `prisma/schema.prisma` — add `additionalGivenNames String?` to `Person`; migration
  `add_additional_given_names`.
- `src/modules/persons/dto/person.dto.ts` — add `additionalGivenNames` to the shared
  `personFieldsSchema` (`z.string().max(200).nullable().optional()`); covers create/update/import.
- `src/modules/persons/services/persons.service.ts` — thread it through `create`/`update`.
- `src/modules/trees/services/import-export.service.ts` — include it in the export person mapping and
  the import `personRow`.

### Client
- `src/services/types.ts` — add `additionalGivenNames: string | null` to `Person`.
- `src/services/persons.ts` — add it to `PersonInput`.
- `src/components/tree/PersonForm.tsx` — add an "Other first names" input under "Given name"
  (form value + mappers).
- `src/components/tree/PersonNode.tsx`, `src/utils/person.ts` (`fullName`) — **no change** (node display unchanged).
- `src/utils/search.ts` — include `additionalGivenNames` in the matched fields.
- `src/utils/person.ts` — add a helper (e.g. `allGivenNames` / `searchLabel`) that combines the
  primary + additional first names; used by the search result rows.
- `src/components/tree/TreeSearch.tsx` — result rows show all first names (primary + additional)
  via the helper, instead of just `fullName`.
- `src/i18n/locales/{fr,en}.json` — label key (`form.additionalGivenNames`).

## Data Model
`Person` gains `additionalGivenNames String?`. Export person objects gain the same optional field.

## UI / UX
- In the person form, a text field "Other first names" (FR "Autres prénoms") under "Given name".
- Nothing changes on the graph nodes.

## Test Plan
### Server (Jest)
- `person.dto`: accepts `additionalGivenNames`; over-200 chars rejected.
- `persons.service`: `create` passes it through.
- import/export: round-trips the field (extend an existing e2e).

### Web (Vitest)
- `PersonForm`: the field submits its value; `fullName` is unaffected by it (node display unchanged).
- `search.ts`: a person is found when the query matches an additional first name.
- The search-label helper combines primary + additional first names.

## Out of Scope
- Showing additional first names on the graph node (only in the form and search results).
- A structured list/tags UI (a single free-text field for now).

## Open Questions
None.
