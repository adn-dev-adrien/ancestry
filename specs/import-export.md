# Import / Export (JSON) — Phase 2

## Status
Implemented

## Context
Trees live only in the database; there is no way to back one up, move it between instances, or
share it as a file. Phase 2 adds JSON export of a tree and import of such a file. Import can
either create a brand-new tree or replace the content of an existing tree (user's choice).
This unlocks the MVP "import/export" criterion left out of Phase 1.

No authentication yet, so any tree can be exported/imported (single anonymous owner).

## Goal
1. From a tree, download a portable, versioned JSON file containing the tree and its full graph.
2. From the home page, import such a file and either create a new tree or replace an existing one.
3. Import is atomic (all-or-nothing) and re-maps person ids so files are self-contained.

## Functional rules

### Export
- `GET /api/trees/:treeId/export` returns a versioned payload (below). 404 if the tree is missing.
- The client downloads it as `<sanitized-title>.json`.
- Export includes person presentation fields (`x`/`y`) so layout is preserved on re-import.

### Import — payload validation
- Validated by a Zod schema: `version === 1`; `tree.title` 1–200; each person valid per the
  Phase-1 person rules (givenName 1–100, dates `YYYY-MM-DD`|null, `living` boolean, etc.) plus a
  local string `id`; each relationship references person `id`s **present in the file**, `type` is
  valid, and `source !== target`.
- Referential-integrity or schema errors → HTTP 400 with the structured `{ statusCode, message, issues }`.
- Import assumes a well-formed graph (e.g. produced by export): structural + referential validation
  is enforced, but heavy business-rule re-checks (cycle detection, duplicate/mixed pairs) are **not**
  re-run — exact duplicates are still blocked by the DB unique constraint. (See Out of scope.)

### Import — create new tree
- `POST /api/trees/import` with the payload creates a new tree, then its persons (fresh uuids,
  building an old→new id map), then its relationships using the mapped ids — all in one Prisma
  transaction. Returns `TreeSummary` (201). On any error nothing is persisted.

### Import — replace existing tree
- `POST /api/trees/:treeId/import` replaces that tree's content in one transaction: delete its
  persons (cascade removes relationships), update `title`/`description` from the file, then recreate
  persons and relationships with fresh ids. 404 if the tree is missing. Returns `TreeSummary` (200).

## Architecture

### Server
- `src/modules/trees/dto/import.dto.ts` — Zod `exportPayloadSchema` (version, tree, persons[],
  relationships[]) + inferred types; reuses the person field constraints from `person.dto.ts`.
- `src/modules/trees/services/import-export.service.ts` — `export(treeId)` builds the payload from
  the graph; `importNew(payload)` and `importReplace(treeId, payload)` do the transactional
  id-remapped creation. Uses `PrismaService.$transaction`.
- `src/modules/trees/repositories/trees.repository.ts` — add transactional helpers if needed
  (bulk `createMany` for persons/relationships within a transaction).
- `src/modules/trees/controllers/trees.controller.ts` — add `GET :treeId/export`,
  `POST import`, `POST :treeId/import` (Zod-validated body).
- `src/modules/trees/trees.module.ts` — provide the new service.

### Client
- `src/services/importExport.ts` — `exportTree(treeId)` (fetch payload + trigger file download),
  `importNewTree(payload)`, `importIntoTree(treeId, payload)`; reuse `api` + typed payload.
- `src/hooks/useImportExport.ts` — TanStack mutations; invalidate `['trees']` / `['tree', id]`.
- `src/pages/HomePage.tsx` — "Import" button → hidden file input → parse JSON → a dialog to choose
  **New tree** or **Replace an existing tree** (a `Select` of current trees) → run import →
  navigate to the resulting tree. Surface 400 errors.
- `src/components/tree/Toolbar.tsx` — an "Export" button (download icon) on the tree page.
- `src/i18n/locales/{fr,en}.json` — keys for Import/Export, the import dialog, and import errors.

### Shared shape
The export payload type is hand-typed on the web in `src/services/importExport.ts`, mirroring the
server Zod schema (consistent with the existing "no shared package yet" approach).

## Data Model
No schema change. Portable file format:
```json
{
  "version": 1,
  "exportedAt": "2026-05-27T10:00:00.000Z",
  "tree": { "title": "My family", "description": null },
  "persons": [
    { "id": "local-1", "givenName": "Ada", "familyName": null, "birthName": null,
      "birthDate": "1815-12-10", "deathDate": "1852-11-27", "living": false,
      "birthPlace": "London", "birthPlaceUncertain": false, "gender": "FEMALE",
      "notes": null, "x": 120.5, "y": 0 }
  ],
  "relationships": [
    { "sourcePersonId": "local-1", "targetPersonId": "local-2", "type": "PARENT_CHILD" }
  ]
}
```
`id`s are file-local; the server re-maps them to fresh uuids on import.

## UI / UX
- **Home page:** an "Import" button next to "New tree". Picking a file opens a dialog:
  - Choice 1: *New tree* — creates a new tree from the file (title taken from the file).
  - Choice 2: *Replace an existing tree* — a dropdown of existing trees; confirms before replacing.
  - On success, navigate to the resulting tree. Parse/validation errors shown inline.
- **Tree page:** an "Export" button in the toolbar downloads `<title>.json`.
- All labels localized (FR default).

## Test Plan
### Server (Jest)
- `export` returns a `version: 1` payload with persons + relationships and no DB ids leaking as tree-scoped.
- `importNew` creates a tree, remaps ids, and links relationships to the new person ids.
- `importReplace` clears the old graph and recreates from the file (count matches the file).
- Invalid payload (bad version, relationship referencing an unknown person id, self-relationship)
  → 400.
- Atomicity: a mid-import failure persists nothing (transaction rollback).
- e2e: export a tree, import it as a new tree, GET both → identical graphs (modulo ids).

### Web (Vitest)
- `importExport` services unit-tested with `fetch` mocked (download trigger stubbed).
- Import dialog: choosing "New tree" vs "Replace" calls the right endpoint.

## Out of Scope
- GEDCOM or any non-JSON format (later).
- Cross-version migration of the export format (only `version: 1` now; unknown versions → 400).
- Re-running full relationship business rules on import (cycle/mixed/duplicate-direction);
  exact duplicate pairs remain blocked by the DB unique constraint.
- Merging a file into an existing tree (only create-new or full-replace).
- Partial/selective export (always the whole tree).

## Open Questions
None.
