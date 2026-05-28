# Mobile layout polish

## Status
Implemented

## Context
On a phone, a few areas don't fit the screen width or don't scroll, hurting usability:
1. The home header (language flags + "Import" + "New tree") overflows the width instead of wrapping.
2. In the person form, the birth date / death date inputs sit side-by-side and overflow on narrow screens.
3. In the person detail panel (bottom drawer on mobile), the lower part of the form can't be reached —
   the drawer content doesn't scroll.

This is responsive/CSS only — no data, API, or behavior change.

## Goal
On small screens:
1. The home header controls wrap onto another line when they don't fit (no horizontal overflow).
2. The birth/death date fields stack vertically when too narrow, and sit side-by-side on wider screens.
3. The person detail panel scrolls so every field (down to the buttons) is reachable.

## Functional rules
- No fixed desktop layout regression: on `md+` the home header and the date fields keep their current
  side-by-side arrangement.
- Nothing horizontally overflows the viewport on a 360px-wide phone.
- The detail panel (drawer on `< md`, sheet on `md+`) is fully scrollable to its last control.

## Architecture (client only)
- `src/pages/HomePage.tsx` — make the header wrap: allow the title/controls to flow to a second line
  (`flex-wrap`, gap), and let the controls group wrap too. Optionally tighten button spacing on mobile.
- `src/components/tree/PersonForm.tsx` — change the birth/death row from a fixed two-column grid to
  `grid-cols-1 sm:grid-cols-2` so the two dates stack on narrow screens.
- `src/components/tree/PersonDetailPanel.tsx` — ensure the drawer (and sheet) content area scrolls:
  give the content a bounded height and an inner scroll container (`overflow-y-auto`, `flex` column),
  so the body scrolls under a fixed header. Keep drag-to-dismiss working from the handle/header.
- No change to `src/components/ui/*` unless the drawer primitive needs a scroll-friendly height.

## Data Model
None.

## UI / UX
- Phone home page: "Ancestry" on the first line; the flags + Import + New tree wrap neatly (right-aligned)
  to the next line when needed.
- Phone person form: birth date above death date when the screen is narrow; two columns on ≥ `sm`.
- Phone person panel: the form scrolls vertically; the Save/Delete buttons are reachable.

## Test Plan
- Manual (Chrome DevTools at 360×740 and a desktop width):
  - Home header never overflows; controls wrap on the phone, stay inline on desktop.
  - Person form: dates stack on phone, side-by-side on desktop.
  - Person panel: can scroll to the bottom (gender, notes, buttons) on phone.
- Existing component tests keep passing (no behavior change). `npm run build` + `lint` pass.

## Out of Scope
- A dedicated mobile navigation or redesign.
- Changing the toolbar, canvas, or any non-listed screen.
- New breakpoints/design tokens beyond Tailwind defaults.

## Open Questions
None.
