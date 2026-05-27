# Person extra fields — birth name, living flag, birth place

## Status
Implemented

## Context
The Tree CRUD Phase 1 person form captures given name, family name, birth/death dates,
gender and notes. Real genealogy needs a few more basics on the very first version:
a person's name at birth (which often differs from the current/married family name),
a way to mark someone as still alive (rather than "death date simply unknown"), and a
birth place whose reliability can be flagged when the user is not sure of it.

This spec extends the existing `Person` model and the add/edit person form. It does not
touch relationships, layout, or any other Phase 1 behavior.

## Goal
The person form (create and edit) additionally lets the user:
1. Enter a **birth name** (`birthName`), distinct from the existing family name.
2. Mark the person as **living**, which removes/locks the death date.
3. Enter a **birth place** and flag it as **uncertain** when the value is not sure.

All four values persist, reload correctly, and follow the existing validation/error contract.

## Functional rules

### Birth name
- Optional, 0–100 chars. Independent from `familyName` (current/used name).

### Living flag
- Boolean, default `false`.
- When `living = true`, `deathDate` must be `null`. The server rejects a payload that sets
  both `living = true` and a non-null `deathDate` with HTTP 400 (validation error).
- When `living = false`, `deathDate` may be set or null (null = unknown), as today.
- The existing rule still holds: when both `birthDate` and `deathDate` are set,
  `deathDate >= birthDate`.

### Birth place
- `birthPlace`: optional, 0–200 chars.
- `birthPlaceUncertain`: boolean, default `false`. Meaningful as "the birth place value is
  not sure". Allowed independently of whether `birthPlace` is filled (a blank place with the
  flag set is tolerated but has no visible effect).

### Gender colors (graph)
- Person nodes are tinted by gender: `FEMALE` → pink, `MALE` → blue,
  `OTHER` or no gender → neutral (current default styling).
- The tint applies to the node card (border + light background); the selection ring is drawn
  on top and stays unchanged. No data-model change — purely presentational.

### Backward compatibility
- Existing persons get `birthName = null`, `birthPlace = null`,
  `birthPlaceUncertain = false`, `living = false` via column defaults in the migration.

## Architecture

### Server
- `prisma/schema.prisma` — add `birthName String?`, `birthPlace String?`,
  `birthPlaceUncertain Boolean @default(false)`, `living Boolean @default(false)` to `Person`.
- `prisma/migrations/` — new migration `add_person_extra_fields`.
- `src/modules/persons/dto/person.dto.ts` — extend create/update Zod schemas with the four
  fields; add a `.refine` rejecting `living === true && deathDate` (non-null).
- `src/modules/persons/services/persons.service.ts` — pass the new fields through create/update
  (date-order rule unchanged). Living/deathDate exclusivity is enforced at the DTO boundary (400).

### Client
- `src/components/ui/checkbox.tsx` — new shadcn primitive (`@radix-ui/react-checkbox`).
- `src/services/types.ts` — add the four fields to `Person`.
- `src/services/persons.ts` — add them to `PersonInput`.
- `src/components/tree/PersonForm.tsx` —
  - "Birth name" text input.
  - "Living" checkbox; when checked, the death-date input is disabled and its value cleared.
  - "Birth place" text input with an adjacent "Uncertain" checkbox.
  - Form Zod schema mirrors the server rule (death date disabled when living).
- `src/components/tree/PersonNode.tsx` — when `birthPlace` is set, show it on a small line;
  append a "?" marker when `birthPlaceUncertain` is true; tint the card by gender (pink/blue/neutral).
- `src/constants/gender.ts` — add a gender → tint-classes map used by the node.

## Data Model
`Person` gains:
```prisma
birthName           String?
birthPlace          String?
birthPlaceUncertain Boolean @default(false)
living              Boolean @default(false)
```
REST payloads (`POST /api/trees/:treeId/persons`, `PATCH /api/persons/:id`, and the `Person`
shape in `GET /api/trees/:treeId`) include the four new fields.

## UI / UX
- Form field order: Given name, Birth name, Family name, Birth date, [Living] Death date,
  Birth place [Uncertain], Gender, Notes.
- Checking **Living** disables and clears the death-date input.
- The **Uncertain** checkbox sits next to the birth-place input; when set, the node shows the
  place followed by " ?".
- **After adding a person** (create flow, "Add person" submit succeeds), the detail panel
  **closes** instead of staying open in edit mode. Editing an existing person keeps today's
  behavior (debounced autosave; panel closed via X / canvas click / Esc).
- Node cards are colored by gender (pink / blue / neutral).

## Test Plan
### Server
- DTO/service: `living = true` with a death date → 400; `living = true` with null death date → OK.
- New fields persist and are returned by the get-graph endpoint (extend the e2e or service test).
- Defaults applied for fields omitted from the payload.

### Web
- `PersonForm`: checking "Living" disables the death-date input and clears its value;
  birth name and birth place persist through submit; the uncertain checkbox toggles.
- `PersonNode`: renders the birth place and the " ?" marker only when uncertain.

## Out of Scope
- Certainty flags for any field other than birth place (dates, names) — future, generic approach.
- Place autocomplete, geocoding, or structured address.
- Death place.

## Open Questions
None.
