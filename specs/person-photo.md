# Person photo

## Status
Implemented

## Context
Nodes are text-only. Users want to put a face on each person. We store a small photo directly on
the person as a base64 data URL in the database, show it as an avatar on the tree node and in the
detail panel, and include it in the JSON export so photos travel with a tree (re-imported as-is).

The image is shrunk client-side on upload (the node square is small), so what we persist and
export stays tiny — no separate file storage, no extra endpoints.

## Goal
1. From the person form, upload a photo; it is resized/compressed client-side and stored on the person.
2. The photo shows as an avatar on the node card and (larger) in the detail panel; it can be replaced or removed.
3. The photo is part of JSON export and is restored on import.

## Functional rules
- `Person.photo`: optional string holding an image **data URL**
  (`data:image/(jpeg|png|webp);base64,…`). `null` means no photo.
- **Upload processing (client):** the selected file is center-cropped to a square, resized to a max
  of 256×256, and encoded as JPEG (quality ≈ 0.8) into a data URL. The original file is never sent.
- **Size guard (server):** `photo` must match `^data:image\/(jpeg|png|webp);base64,` and not exceed
  a length cap (~1,500,000 chars). Violations → HTTP 400 (existing Zod 400 contract).
- **Display:** square avatar on the node card (left of the name); larger preview in the detail
  panel. When absent, the node/panel render as today (no avatar).
- **Edit:** the form lets the user add a photo via a file picker **or by dragging an image onto the
  photo zone** at the top of the person panel (replacing any existing one), and remove it (sets `null`).
- **Export/import:** `photo` is included in the export payload and accepted on import like any other
  person field (same validation).

## Architecture

### Server
- `prisma/schema.prisma` — add `photo String?` to `Person`; migration `add_person_photo`.
- `src/modules/persons/dto/person.dto.ts` — add `photo` to the shared `personFieldsSchema`
  (nullable, optional, regex + max-length). This automatically covers create, update, **and** the
  import schema (which extends `personFieldsSchema`).
- `src/modules/persons/services/persons.service.ts` — thread `photo` through create/update
  (same `!== undefined` pattern).
- `src/modules/trees/services/import-export.service.ts` — include `photo` in the export person
  mapping and in the import `personRow`.

### Client
- `src/utils/image.ts` — `fileToAvatarDataUrl(file, size = 256, quality = 0.8): Promise<string>`:
  load the file into an `Image`, center-crop to a square on a `<canvas>`, draw at `size×size`,
  `toDataURL('image/jpeg', quality)`.
- `src/services/types.ts`, `src/services/persons.ts`, `src/services/importExport.ts` — add
  `photo` to `Person`, `PersonInput`, and `ExportPerson`.
- `src/components/tree/PersonForm.tsx` — a photo control: avatar preview, "choose photo" (hidden
  file input → resize → set the form value), and "remove". Add `photo` to the form values/mappers.
- `src/components/tree/PersonNode.tsx` — render a small square avatar (`<img>`) when `photo` is set.
- `src/components/ui/avatar.tsx` — optional small avatar primitive (or a plain `<img>` with fallback).
- `src/i18n/locales/{fr,en}.json` — keys: photo label, choose/replace, remove.

## Data Model
`Person` gains `photo String?`. Export payload person objects gain an optional `photo` string.
No other shape change.

## UI / UX
- **Form:** at the top of the person form, a round/square avatar (or placeholder) with a "Photo"
  button to pick an image and a "Remove" action when one is set. Picking shows the resized preview
  immediately.
- **Node:** ~40px square avatar on the left of the card; name/dates to its right. No avatar when unset.
- All labels localized (FR default).

## Test Plan
### Server (Jest)
- `person.dto`: accepts a valid `data:image/jpeg;base64,…`; rejects a non-image string and an
  over-cap string.
- `persons.service`: `create`/`update` pass `photo` through.
- `import-export.service`: `export` includes `photo`; `importNew` persists it.
- e2e: create a person with a photo → export → import-new → the photo survives.

### Web (Vitest)
- `PersonForm`: when a person has a `photo`, the preview renders; "remove" clears it
  (submitted input has `photo: null`). (File→canvas resize is exercised manually; jsdom canvas is
  stubbed/are not asserted.)

## Out of Scope
- Multiple photos / galleries.
- Interactive crop/zoom UI (auto center-crop only).
- Server-side file storage or a CDN.
- Face detection / auto-orientation beyond what the browser provides.

## Open Questions
None.
