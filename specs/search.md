# Person search — Phase 3

## Status
Implemented

## Context
As trees grow, finding a specific person by panning the canvas becomes tedious. Phase 3 adds a
search box on the tree page: typing a name shows a dropdown of matching persons; picking one
centers the viewport on that node and highlights it. No data-model change.

## Goal
On the tree page, a search field lets the user type part of a name, see a ranked list of matching
persons in the current tree, and pick one to recenter/zoom the canvas onto that node with a
selection highlight (without opening the edit panel).

## Functional rules
- Matching is **case-insensitive substring** over `givenName`, `familyName`, and `birthName`.
- The query is matched against the persons already loaded for the open tree (no server call).
- Results are capped (max 8) and ordered: name starting with the query first, then other matches,
  alphabetically by full name within each group.
- An empty/whitespace query shows no dropdown.
- Picking a result: `fitView` centers/zooms onto that node (bounded max zoom) and the node gets the
  selection ring. The edit panel is **not** opened. Picking also clears the query/closes the dropdown.
- Escape or clicking away closes the dropdown.

## Architecture

### Server
No change. Search runs client-side over the already-fetched graph (a pure substring filter is a
presentation concern, not business logic; adding an endpoint to filter an already-loaded list
would only add a round-trip).

### Client
- `src/utils/search.ts` — `searchPersons(persons, query, limit = 8): Person[]`; the matching/ranking
  logic, unit-tested. Reuses `fullName` from `src/utils/person.ts`.
- `src/components/tree/TreeSearch.tsx` — search input + results dropdown. Rendered inside the
  `ReactFlowProvider` on the tree page so it can call `useReactFlow().fitView({ nodes: [{ id }], ... })`
  to center on the chosen node. Calls `onSelect(personId)` to set the highlight.
- `src/pages/TreePage.tsx` — add a `focusedId` state passed to the canvas as an extra highlight;
  `TreeSearch.onSelect` sets it. Mount `TreeSearch` near the top of the tree page.
- `src/components/tree/TreeCanvas.tsx` — include `focusedId` in the node-selection effect (alongside
  `selectedId` and `connectSourceId`) so the focused node shows the ring.
- `src/i18n/locales/{fr,en}.json` — keys for the search placeholder and the "no results" message.

## Data Model
None.

## UI / UX
- A compact search field pinned near the top-left of the tree page (below the title), full-width on
  mobile where the toolbar is at the bottom.
- Typing shows a dropdown listing matches as "Full name — life span"; keyboard/touch friendly.
- Selecting recenters the canvas (animated) and rings the node; the panel stays closed.
- Localized placeholder ("Rechercher une personne…") and empty-result text.

## Test Plan
### Web (Vitest)
- `search.ts`: matches by given/family/birth name; case-insensitive; prefix matches rank first;
  respects the limit; empty query → `[]`.
- `TreeSearch`: typing shows matching results; picking one fires `onSelect` with the right id and
  clears the input. (`fitView` from `useReactFlow` mocked.)

### Manual
- Search a name in a large tree → result list → pick → canvas recenters on the node, node ringed,
  panel closed. Switch language → placeholder/empty text localized.

## Out of Scope
- Server-side or cross-tree search.
- Filtering/dimming non-matching nodes on the canvas (chose the dropdown-only approach).
- Advanced queries (dates, places, relationships) — name only for now.
- Fuzzy/typo-tolerant matching.

## Open Questions
None.
