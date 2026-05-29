# Person form polish — death place, reorder, name normalization, sticky action bar

## Status
Implemented

## Context
Four improvements to the person form:
1. We can record a **birth place** but not a death place. Add it (with an "uncertain" flag, same
   shape as `birthPlace`).
2. The fields around birth/death are in a fixed 2-column grid; we want a clearer flow:
   birth date → birth place → "Living" checkbox → (if not living) death date → death place.
3. Names ("prénom", "nom de famille", "nom de naissance", "autres prénoms") are stored as-typed,
   leading to "DURAND", "marie", "JEAN-PAUL". Normalize them so they always look like proper names.
4. The form's primary action ("Ajouter" / "Enregistrer") sits at the bottom; with the new vertical
   layout it scrolls off-screen quickly. Move it to a sticky top bar that follows the scroll.

## Goal
- `Person.deathPlace` + `deathPlaceUncertain` are stored and editable.
- The form lays out birth/living/death in a clear, single-column flow; ticking **En vie** **hides**
  the death date **and** death place (not just disables them).
- Name fields are stored with a clean capitalization, regardless of how the user typed them.
- The primary save/add button remains visible at the top of the panel while scrolling.

## Functional rules

### Death place
- `Person.deathPlace` (free text, 0–200 chars, optional). `deathPlaceUncertain` (boolean, default `false`).
- Editable in the form under the death date; the "uncertain" checkbox sits next to it (same UX as the
  birth place). Included in JSON export/import.
- On the graph node we **do not** display the death place (kept minimal). It only lives in the fiche.

### Form layout (single column, in this order)
1. Given name (`givenName`)
2. Other first names (`additionalGivenNames`)
3. Family name (`familyName`)
4. Birth name (`birthName`)
5. **Birth date** (`birthDate`)
6. **Birth place** + uncertain (`birthPlace`, `birthPlaceUncertain`)
7. **Living** checkbox (`living`)
8. **Death date** (`deathDate`) — **hidden** when `living` is checked
9. **Death place** + uncertain (`deathPlace`, `deathPlaceUncertain`) — **hidden** when `living` is checked
10. Gender, Notes (unchanged)

When `living` is toggled on, both death-date and death-place values are cleared (and hidden).
When toggled off, the fields reappear empty (the form recovers nothing from before).
The mobile `grid-cols-1 sm:grid-cols-2` for the date row is no longer needed (single column flow).

### Name normalization
- Applied to `givenName`, `additionalGivenNames`, `familyName`, `birthName`.
- Strategy: trim, lowercase the whole string, then **capitalize the first letter of every word**
  using spaces, hyphens and apostrophes as separators. Examples:
  - `DURAND` → `Durand`
  - `marie` → `Marie`
  - `JEAN-PAUL` → `Jean-Paul`
  - `d'arc` → `D'Arc`
  - `marie jeanne joséphine` → `Marie Jeanne Joséphine`
- Implemented **server-side** in the Zod `personFieldsSchema` via `.transform()`, so the rule
  applies to every entry path (form, import). Empty strings/`null` are preserved.

### Sticky action bar
- The primary submit button (`form.addPerson` / `form.save`) and the destructive `form.delete`
  button (edit mode only) move out of the form bottom into a **sticky banner pinned at the top of
  the scroll container** of the Sheet/Drawer (`PersonDetailPanel`), just under the header.
- The banner uses `sticky top-0` with a solid background and a bottom border so it does not blend
  into the scrolling content underneath. It hosts the same buttons (same labels, same disabled
  rule on the submit button); they are not duplicated at the bottom of the form.
- Submitting from the banner still triggers the form's `handleSubmit` (the button stays
  `type="submit"` inside the `<form>`, with the banner rendered at the top of the form's children).
- Mobile: same behavior — the Drawer's scroll container is the existing
  `overflow-y-auto` div, and the banner sticks to its top.

## Architecture

### Server
- `prisma/schema.prisma` — add `deathPlace String?`, `deathPlaceUncertain Boolean @default(false)`
  to `Person`; migration `add_death_place`.
- `src/modules/persons/dto/person.dto.ts`:
  - Add `deathPlace` (string ≤ 200, nullable optional) and `deathPlaceUncertain` (boolean optional)
    to `personFieldsSchema`.
  - Apply a `normalizeName` transform to `givenName`, `additionalGivenNames`, `familyName`,
    `birthName` (helper `src/modules/persons/dto/name-normalize.ts`, unit-tested).
- `src/modules/persons/services/persons.service.ts` — thread the two new fields through `create`/`update`.
- `src/modules/trees/services/import-export.service.ts` — include `deathPlace`/`deathPlaceUncertain`
  in the export person mapping and in the import `personRow`.

### Client
- `src/services/types.ts`, `src/services/persons.ts`, `src/services/importExport.ts` — add the two
  new fields to `Person`, `PersonInput`, `ExportPerson`.
- `src/components/tree/PersonForm.tsx`:
  - Add `deathPlace`/`deathPlaceUncertain` to form values, schema and mappers.
  - Reorder the fields to match §Form layout.
  - When `living` is true, render-hide death date and death place (and clear their values on toggle on).
  - Remove the `grid-cols-2` date row.
  - Move the submit/delete buttons into a `sticky top-0` action bar rendered at the top of the
    `<form>` instead of at the bottom.
- `src/i18n/locales/{fr,en}.json` — add `form.deathPlace` (and reuse `form.uncertain`).
- `src/components/tree/PersonNode.tsx` — **no change** (death place not shown on the node).

## Data Model
`Person` gains `deathPlace String?` and `deathPlaceUncertain Boolean @default(false)`. Export person
objects gain the same two optional fields.

## Test Plan
### Server (Jest)
- `name-normalize` util: covers the examples above (including hyphen/apostrophe), null/empty pass-through.
- `person.dto`: name fields are normalized; `deathPlace` accepted / over-200 rejected.
- `persons.service`: `create` passes `deathPlace`/`deathPlaceUncertain` through.
- e2e (extend existing): round-trip `deathPlace` through export/import.

### Web (Vitest)
- `PersonForm`: ticking "En vie" hides the death date and death place inputs (and clears them);
  unticking shows them again (empty).
- All existing fixtures updated with the two new fields.

## Out of Scope
- Showing the death place on the graph node.
- Migrating existing rows to apply name normalization retroactively (normalization applies on the
  next save/import; old rows keep their value until edited).
- A combined "place" component (date + place) — birth/death stay independent inputs.
- A configurable normalization strategy (the smart-French rule is the only one supported).

## Open Questions
None.
