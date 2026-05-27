# Zoom-adaptive node detail (level of detail)

## Status
Implemented

## Context
At low zoom the person card still tries to render every field, so the text becomes unreadable and
cluttered. We want the node to reveal information progressively as the user zooms in, keeping what
is shown legible for the current on-screen size: far out → only the name; a bit closer → add the
photo; closer still → all the current details. Front-end only, no data/server change.

## Goal
A person node renders one of three detail levels driven by the React Flow zoom so content stays
readable:
1. **Compact** (very zoomed out): given + family name only, centered, filling the card.
2. **Medium** (zoomed in a bit): name + photo avatar.
3. **Full** (zoomed in more): everything shown today (name, photo, life span, birth place, gender chip).

## Functional rules
- The level is chosen from the live zoom factor so that text is legible at its on-screen size
  (rendered size ≈ `fontSize × zoom`). Two thresholds split compact / medium / full.
- Thresholds (initial, tunable constants): `zoom < 0.55` → compact; `0.55 ≤ zoom < 0.85` → medium;
  `zoom ≥ 0.85` → full. (Chosen so the ~14px name stays ≳ 11px on screen in compact, and the
  ~12px detail lines only appear once they render ≳ ~10px.)
- The node box keeps a constant size (`NODE_WIDTH × NODE_HEIGHT`) at every level so the layout and
  edges do not move; only the inner content changes.
- In compact mode the name is centered and may use a slightly larger weight/size to stay readable;
  long names truncate (no overflow).
- Selection ring, gender tint, handles, and edge anchoring are unchanged across levels.
- Updating happens reactively as the user zooms (no reload).

## Architecture

### Client
- `src/components/tree/PersonNode.tsx` — read the current zoom via React Flow
  `useStore((s) => s.transform[2])`; derive the detail level and render accordingly:
  - compact: centered name only;
  - medium: avatar + name;
  - full: current full layout.
  Keep the wrapper box size fixed.
- `src/utils/nodeDetail.ts` (small, testable) — `nodeDetailLevel(zoom): 'compact' | 'medium' | 'full'`
  with the threshold constants, unit-tested.
- No change to `layout.ts`, edges, server, or types.

### Server
No change.

## Data Model
None.

## UI / UX
- Zoom out fully: cards show just the name, centered and legible.
- Zoom in once: photos appear beside the name.
- Zoom in further: dates, birth place and gender chip appear — the current full card.
- Transitions are immediate as zoom crosses the thresholds; node size is stable throughout.

## Test Plan
### Web (Vitest)
- `nodeDetail.ts`: `nodeDetailLevel` returns compact/medium/full around the thresholds (boundaries).
- `PersonNode`: with `useStore` mocked to a low zoom only the name renders (no photo/dates); at
  medium zoom the photo renders but not the dates; at high zoom the life span/birth place render.

### Manual
- Open a populated tree, zoom out → names only; zoom in step by step → photo, then full details;
  verify legibility and that node boxes/edges don't shift.

## Out of Scope
- Counter-scaling text to a constant on-screen size (we use discrete levels, not continuous scaling).
- Per-user or persisted detail preferences.
- Changing the node dimensions or the dagre layout.
- Level-of-detail for edges/badges (only person nodes).

## Open Questions
None.
