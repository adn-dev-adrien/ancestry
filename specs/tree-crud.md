# Tree CRUD — Phase 1

## Status
Implemented

## Context
The scaffold is in place but the app has no domain logic yet. Phase 1 must deliver the foundation a user actually wants: create a tree, add people, link them as parents/children/spouses, see the result rendered as a tree, edit a person via a side panel, and reload the page without losing anything.

This single feature covers the MVP acceptance criteria minus import/export (which is Phase 2):
- Create a tree and add at least 10 related people.
- See the tree rendered with pan/zoom, select nodes, edit them.
- Reload the page and recover the same state.

There is no authentication yet. The app behaves as if a single anonymous user owns all trees on the instance. Auth is Phase 4.

## Goal
End-to-end working slice from PostgreSQL to React Flow:
1. Server exposes CRUD endpoints for `Tree`, `Person`, `Relationship`.
2. Database persists everything atomically via Prisma migrations.
3. Web app lists trees, opens one, renders persons and links via React Flow with dagre layout, lets the user add/edit/delete persons and relationships via touch- and mouse-friendly interactions.
4. The UI is usable on a 360×740 phone and on a 1440×900 desktop without layout breakage.

## Functional rules

### Trees
- A `Tree` has a required `title` (1–200 chars) and an optional `description` (0–2000 chars).
- A user can create, list, fetch one (with all persons and relationships), update title/description, and delete a tree.
- Deleting a tree cascades to all its persons and relationships.

### Persons
- A `Person` belongs to exactly one tree.
- Required: `givenName` (1–100 chars).
- Optional: `familyName` (0–100), `birthDate` and `deathDate` (ISO `YYYY-MM-DD` or null), `gender` (enum `MALE | FEMALE | OTHER`), `notes` (0–2000), `x` and `y` (numbers, presentation-only).
- `deathDate`, if both are set, must be greater than or equal to `birthDate`.
- Deleting a person cascades to all relationships that reference it (either side).

### Relationships
- A `Relationship` belongs to exactly one tree and references two persons of that same tree (the server rejects cross-tree references with 400).
- Types: `PARENT_CHILD` (directed: `source` is the parent, `target` is the child) and `SPOUSE` (undirected; persisted with an arbitrary source/target).
- Rules:
  - `source` ≠ `target` (no self-relationship).
  - For `PARENT_CHILD`: no cycle in the parent graph; a person cannot become its own ancestor. Detected server-side on create.
  - A person can have any number of `PARENT_CHILD` parents (no "max 2" constraint — adoptions, step-parents, etc.).
  - For `SPOUSE`: only one `SPOUSE` relationship per unordered `{source, target}` pair (the server normalizes by sorting IDs before checking uniqueness).
  - No `PARENT_CHILD` and `SPOUSE` between the same pair simultaneously (this combination is forbidden because it has no genealogical meaning and likely indicates user error).
- Deleting a relationship leaves both persons untouched.

### Validation and errors
- All inputs validated by Zod schemas via `nestjs-zod` at the controller boundary.
- Validation errors → HTTP 400 with body `{ statusCode, message, issues: ZodIssue[] }`.
- Not found → HTTP 404 with body `{ statusCode, message }`.
- Business-rule violations (cycle, duplicate spouse, cross-tree reference) → HTTP 409 with `{ statusCode, message, code }` where `code` is one of `RELATIONSHIP_CYCLE`, `DUPLICATE_RELATIONSHIP`, `CROSS_TREE_REFERENCE`.

## Architecture

### Server

- `prisma/schema.prisma` — add `Tree`, `Person`, `Relationship` models, `Gender` and `RelationshipType` enums, indexes, cascade rules.
- `prisma/migrations/` — first migration `0001_init` created via `prisma migrate dev`.
- `src/common/prisma/prisma.service.ts` — Nest injectable wrapping `PrismaClient` with lifecycle hooks.
- `src/common/prisma/prisma.module.ts` — global module exporting `PrismaService`.
- `src/common/errors/business.exceptions.ts` — `BusinessRuleException` (409) with a `code` field, mapped by a global filter.
- `src/common/filters/zod-validation.filter.ts` — converts `ZodError` to the structured 400 response.
- `src/modules/trees/dto/*.ts` — Zod schemas for create/update/response payloads.
- `src/modules/trees/repositories/trees.repository.ts` — Prisma access for trees.
- `src/modules/trees/services/trees.service.ts` — business logic (create, list, get-with-graph, update, delete).
- `src/modules/trees/controllers/trees.controller.ts` — REST endpoints under `/api/trees`.
- `src/modules/trees/trees.module.ts` — wiring.
- `src/modules/persons/...` — same structure for persons (`/api/trees/:treeId/persons`, `/api/persons/:id`).
- `src/modules/relationships/...` — same structure for relationships (`/api/trees/:treeId/relationships`, `/api/relationships/:id`); contains the cycle-detection helper and the spouse-normalization helper.
- `src/app.module.ts` — registers PrismaModule, TreesModule, PersonsModule, RelationshipsModule and the global filters.

### Client

- `src/pages/HomePage.tsx` — list of trees with a "New tree" button (opens a dialog with a single title input).
- `src/pages/TreePage.tsx` — main canvas page for a single tree, parameterized by tree id from the URL.
- `src/router.tsx` — minimal route table (`/` → HomePage, `/trees/:treeId` → TreePage), wired with `react-router-dom`.
- `src/components/tree/TreeCanvas.tsx` — React Flow viewport, `PersonNode` renderer, edge styling for parent-child vs spouse, dagre-driven layout effect.
- `src/components/tree/PersonNode.tsx` — custom React Flow node: card with name, dates, gender chip, selection ring.
- `src/components/tree/PersonDetailPanel.tsx` — responsive panel: shadcn `Sheet` (right) on `md+`, shadcn `Drawer` (bottom) on smaller screens. Shows the `PersonForm` and a list of relatives.
- `src/components/tree/PersonForm.tsx` — React Hook Form + Zod, fields for givenName/familyName/birth/death/gender/notes, save and delete buttons.
- `src/components/tree/ConnectModeOverlay.tsx` — when active, intercepts node taps: first tap picks source, second tap opens a popover ("Parent of", "Child of", "Spouse of").
- `src/components/tree/Toolbar.tsx` — floating toolbar (top on `md+`, bottom on `sm`) with: fit-view, connect-mode toggle, add-person, back to home.
- `src/components/ui/*` — shadcn primitives added on demand: `dialog`, `drawer`, `sheet`, `input`, `label`, `form`, `popover`, `select`, `textarea` (added via `npx shadcn@latest add` during implementation).
- `src/services/api.ts` — typed fetch wrapper reading `VITE_API_URL`, handling JSON, surfacing the structured server error shape.
- `src/services/trees.ts`, `persons.ts`, `relationships.ts` — one function per endpoint.
- `src/hooks/useTrees.ts`, `useTree.ts`, `usePersonMutations.ts`, `useRelationshipMutations.ts` — TanStack Query hooks with optimistic updates for person position drags.
- `src/utils/layout.ts` — dagre layout: takes `{persons, relationships}`, returns `{nodes, edges}` with `position` for React Flow. Honors stored `x/y` if present, otherwise falls back to dagre output.
- `src/utils/relationships.ts` — derive `parentsOf(personId)`, `childrenOf(personId)`, `spousesOf(personId)` from the loaded graph.
- `src/constants/gender.ts`, `src/constants/relationshipType.ts` — enums shared with form selects and node display.

### Shared shape (no shared package yet)
DTO shapes are defined as Zod schemas on the server and re-typed (by hand, kept narrow) on the web in `src/services/*.ts`. When divergence becomes painful, we extract a `packages/shared` workspace.

## Data Model

### Prisma models
```prisma
enum Gender {
  MALE
  FEMALE
  OTHER
}

enum RelationshipType {
  PARENT_CHILD
  SPOUSE
}

model Tree {
  id            String         @id @default(uuid())
  title         String
  description   String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  persons       Person[]
  relationships Relationship[]
}

model Person {
  id         String   @id @default(uuid())
  treeId     String
  tree       Tree     @relation(fields: [treeId], references: [id], onDelete: Cascade)
  givenName  String
  familyName String?
  birthDate  String?
  deathDate  String?
  gender     Gender?
  notes      String?
  x          Float?
  y          Float?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  sourceRels Relationship[] @relation("RelationshipSource")
  targetRels Relationship[] @relation("RelationshipTarget")

  @@index([treeId])
}

model Relationship {
  id             String           @id @default(uuid())
  treeId         String
  tree           Tree             @relation(fields: [treeId], references: [id], onDelete: Cascade)
  sourcePersonId String
  source         Person           @relation("RelationshipSource", fields: [sourcePersonId], references: [id], onDelete: Cascade)
  targetPersonId String
  target         Person           @relation("RelationshipTarget", fields: [targetPersonId], references: [id], onDelete: Cascade)
  type           RelationshipType
  createdAt      DateTime         @default(now())

  @@unique([sourcePersonId, targetPersonId, type])
  @@index([treeId])
}
```

### REST contract

| Method | Path                                       | Body                                                                          | Response                            |
|--------|--------------------------------------------|-------------------------------------------------------------------------------|-------------------------------------|
| POST   | `/api/trees`                               | `{ title, description? }`                                                     | `TreeSummary`                       |
| GET    | `/api/trees`                               | —                                                                             | `TreeSummary[]`                     |
| GET    | `/api/trees/:treeId`                       | —                                                                             | `TreeWithGraph`                     |
| PATCH  | `/api/trees/:treeId`                       | `{ title?, description? }`                                                    | `TreeSummary`                       |
| DELETE | `/api/trees/:treeId`                       | —                                                                             | `204 No Content`                    |
| POST   | `/api/trees/:treeId/persons`               | `{ givenName, familyName?, birthDate?, deathDate?, gender?, notes?, x?, y? }` | `Person`                            |
| PATCH  | `/api/persons/:personId`                   | partial of the above                                                          | `Person`                            |
| DELETE | `/api/persons/:personId`                   | —                                                                             | `204 No Content`                    |
| POST   | `/api/trees/:treeId/relationships`         | `{ sourcePersonId, targetPersonId, type }`                                    | `Relationship`                      |
| DELETE | `/api/relationships/:relationshipId`       | —                                                                             | `204 No Content`                    |

Payload shapes:
- `TreeSummary` = `{ id, title, description, createdAt, updatedAt, personCount }`
- `TreeWithGraph` = `TreeSummary` + `{ persons: Person[], relationships: Relationship[] }`
- `Person` = full DB row except `treeId` is included.
- `Relationship` = full DB row.

## UI / UX

### Home page (`/`)
- Header: app name on the left, "New tree" button on the right.
- List of trees as cards (title, description, person count, updated-at). Tap → tree page.
- Empty state: a single CTA card explaining what to do.

### Tree page (`/trees/:treeId`)

**Desktop (`md+`)**
- Top header: back button, tree title (editable inline), toolbar (fit-view, add person, connect mode toggle).
- Full-screen React Flow canvas below header.
- Right-side `Sheet` opens on node selection. Closes via X or by clicking the canvas background.

**Mobile (`< md`)**
- Top header: back button + truncated title.
- Full-screen canvas.
- Bottom toolbar (floating, semi-transparent, safe-area-aware): fit-view, add person, connect mode toggle, more menu.
- Bottom `Drawer` opens on node tap. Drag-down to dismiss.

**Person node card**
- Min size 160×72 px on desktop, 144×64 px on mobile (always tappable).
- Shows: full name (bold), birth–death line ("1952 – 1998" or "b. 1952"), small gender chip.
- Selection ring + slight scale-up when selected.

**Connect mode**
- Toggled from toolbar.
- Tap source → source is highlighted.
- Tap target → popover near the target asks: "{source} is …" with three buttons: "Parent of {target}", "Child of {target}", "Spouse of {target}". Cancel returns to selection mode without exiting connect mode.
- Esc / tap blank canvas exits connect mode.

**Add person flow**
- Toolbar "+" opens the detail panel in "new" mode with an empty form.
- On save: person is added at the center of the current viewport, layout re-runs if no spouse/parent yet, then the new person is selected.

**Edit & delete**
- Selecting a node opens the panel pre-filled.
- Save is debounced 500 ms after the last change OR triggered explicitly by a save button on mobile.
- Delete button has a confirmation step ("Delete this person and all their relationships?").

**Layout**
- Dagre top-to-bottom (`rankdir: TB`), `nodesep: 40`, `ranksep: 80`.
- A person's stored `x/y` overrides dagre positioning (so user drags stick across reloads).
- Spouse edges are dashed and routed horizontally.
- Parent-child edges are solid with an arrow at the child end.

**Layout persistence**
- Dragging a node auto-saves its `x/y` via `PATCH /api/persons/:id` after 1 s of idle.
- The toolbar also exposes an explicit **Save** button (icon: floppy disk) that:
  - Immediately flushes any pending debounced save (no waiting on the 1 s timer).
  - Shows a transient "Saved" toast on success.
  - Is disabled while no unsaved changes exist (label changes to "Saved" with a check icon).
- A subtle status indicator next to the toolbar reflects state: `idle | dirty | saving | saved`. This prevents confusion between the two save paths.

## Test Plan

### Server (Jest)
Unit tests for services:
- TreesService: create returns summary; getWithGraph includes persons & relationships; delete cascades.
- PersonsService: create rejects person on missing tree; validates `birthDate <= deathDate`; deletes cascade relationships.
- RelationshipsService:
  - Rejects self-relationship.
  - Rejects cross-tree references.
  - Rejects duplicate `PARENT_CHILD` (same direction).
  - Rejects duplicate `SPOUSE` regardless of direction.
  - Rejects cycle creation (A → B → A) for `PARENT_CHILD`.
  - Rejects mixing `PARENT_CHILD` and `SPOUSE` between the same pair.

E2E tests (supertest, against test database):
- Full lifecycle: create tree → add 3 persons → add 2 PARENT_CHILD + 1 SPOUSE → GET tree returns the full graph.
- Deleting a person removes its relationships.

### Web (Vitest + Testing Library)
- `layout.ts`: given a fixture graph, returns nodes/edges with deterministic positions; stored `x/y` overrides dagre.
- `relationships.ts`: parentsOf / childrenOf / spousesOf return the right ids on a fixture.
- `PersonForm`: validation displays errors for empty givenName and for deathDate < birthDate.
- `PersonNode`: renders name and dates; receives selection prop.
- `services/*`: unit-tested with `fetch` mocked.

### Manual verification (mobile + desktop)
- Create a tree, add 10 persons including 2 couples and their children, reload page, observe full restoration.
- Drag a person — position survives reload.
- Drag-create a parent-child link via connect mode on touch device (Chrome DevTools mobile emulation OK if no phone available).
- Delete a person — verify the relatives in the detail panel no longer list them.

## Out of Scope
- JSON import/export (Phase 2).
- Authentication and per-user tree ownership (Phase 4).
- Sharing or collaboration.
- Undo/redo.
- Photos and custom fields.
- GEDCOM import.
- Search and filter across the tree (Phase 3).
- WebGL rendering or viewport culling (Phase 3 — only triggered by measured perf issues).
- Inline editing in the canvas (we use the detail panel by design).

## Resolved decisions
1. **Tree list scope** — keep the list public via `GET /api/trees`. Migration to per-user filtering is trivial in Phase 4.
2. **Edge routing for couples** — two direct edges per child (one to each parent). No invisible union node in MVP.
3. **Drag-and-drop layout persistence** — combined approach: auto-save 1 s debounced AND an explicit "Save" button that flushes pending changes. A status indicator surfaces the current state (`idle | dirty | saving | saved`).
4. **Gender** — Prisma enum `MALE | FEMALE | OTHER`, nullable.
