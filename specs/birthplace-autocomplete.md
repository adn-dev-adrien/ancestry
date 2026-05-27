# Birth place autocomplete (French communes)

## Status
Implemented

## Context
The birth place is a free-text field, so spellings are inconsistent and homonym communes are
ambiguous. We add an autocomplete backed by the official French commune directory
(`geo.api.gouv.fr`), queried live from the browser — the list is **not** stored locally. Because
some communes have been renamed or merged over time, the field stays free text: the user can
always type a value manually when no suggestion fits.

## Goal
While editing a person's birth place, typing shows a dropdown of matching French communes
(name + department); picking one fills the field with `"Name (Department)"`. Typing a value that
matches nothing is kept as-is (manual entry). No data-model or server change.

## Functional rules
- The birth place input is an autocomplete combobox over `geo.api.gouv.fr/communes`.
- Suggestions are fetched when the query has **≥ 2 non-space chars**, debounced (~250 ms),
  `limit=8`, ordered by population (`boost=population`). Each suggestion shows
  `Name — Department (main postal code)`.
- Selecting a suggestion sets `birthPlace` to `"{nom} ({departement.nom})"` (e.g. `Lyon (Rhône)`).
- The field remains fully editable free text: any typed value is accepted and stored
  (manual override for renamed/missing/foreign places). Suggestions never force a choice.
- Network/API errors, no results, or offline → the field silently behaves as a plain text input
  (no blocking, no error surfaced beyond an empty dropdown).
- The list is queried live each time; nothing about communes is persisted client-side beyond
  in-memory query caching. `birthPlace` storage is unchanged (a string), as is the "uncertain" flag.

## Architecture

### Server
No change.

### Client
- `src/services/communes.ts` — `searchCommunes(query, signal?): Promise<Commune[]>` calling
  `https://geo.api.gouv.fr/communes?nom=<q>&fields=nom,departement,codesPostaux&boost=population&limit=8`;
  maps to `{ nom, departement, codePostal }`. `communeLabel(c)` → `"{nom} ({departement})"` (stored
  value) and a display string with the postal code for the dropdown row.
- `src/hooks/useDebouncedValue.ts` — small debounce hook (generic), reused by the field.
- `src/components/tree/CommuneInput.tsx` — controlled `value`/`onChange` text input + suggestions
  dropdown. Uses TanStack `useQuery(['communes', debounced], …, { enabled: len >= 2 })` (cancellation
  via the query's `AbortSignal`). Picking a row calls `onChange(communeLabel)` and closes the
  dropdown; outside-click/Escape close it; typing keeps the raw value.
- `src/components/tree/PersonForm.tsx` — replace the plain birth-place `Input` with `CommuneInput`
  (bound to the `birthPlace` form value via `watch`/`setValue`); the "Uncertain" checkbox stays.
- `src/i18n/locales/{fr,en}.json` — optional "no commune found" hint key (placeholder reuses
  `form.birthPlace`).

## Data Model
None. `Person.birthPlace` stays a free string; selected communes are stored as `"Name (Department)"`.

## UI / UX
- Birth place field looks like today but shows a suggestions dropdown as the user types.
- Rows: bold commune name + muted "Department (postal code)". Mouse/touch friendly.
- Picking fills the input; the user can still edit afterwards. Empty/short queries show no dropdown.
- Localized (FR default); the commune data itself comes from the API (French names).

## Test Plan
### Web (Vitest)
- `services/communes.ts`: builds the right URL, maps the API response to `{ nom, departement,
  codePostal }`, and `communeLabel` formats `"Lyon (Rhône)"`. (`fetch` mocked.)
- `useDebouncedValue`: returns the debounced value after the delay.
- `CommuneInput`: typing ≥2 chars shows mocked suggestions; clicking one calls `onChange` with
  `"Name (Department)"`; typing a custom value passes through unchanged. (`searchCommunes` mocked,
  rendered within a `QueryClientProvider`.)

### Manual
- Edit a person, type "lyo" → see Lyon (Rhône) etc. → pick → field shows `Lyon (Rhône)`, persists.
- Type a made-up/old name → no suggestion → value kept and saved. Toggle language → UI labels switch.

## Out of Scope
- Storing/syncing the commune list locally or on our server.
- Non-French places (handled by free-text manual entry).
- Validating that a stored birth place is a real commune.
- Postal-code or department search modes (name search only).
- Autocomplete for any other field.

## Open Questions
None.
