# Family bus for parent-child links

## Status
Implemented

## Context
Today every parent→child relationship is its own edge, so a couple with several children produces a
dense web of crossing lines (and a baby badge on each), which is hard to read. We replace this with a
classic genealogy "family bus": the parents of a sibling group join at a small junction, from which a
single connector branches down to all the children. We also drop the per-edge baby icon. Front-end
only — the data model and the stored relationships are unchanged; the bus is a rendering/layout
construct derived from the existing parent-child edges.

## Goal
For each set of children sharing the same parent(s), draw one junction between the generations:
parents connect down into it, and a single elbow connector fans out from it to every child. With many
children the area is far cleaner: one trunk + one sibling bar instead of N independent diagonals, and
no baby badges. Spouse (marriage) links are unchanged.

## Functional rules
- A **family** is a distinct set of parents (1 or 2 person ids) together with the children that have
  exactly that parent set (derived from the stored `PARENT_CHILD` relationships).
- For each family, layout introduces a tiny invisible **union node** placed between the parents'
  generation and the children's generation. Edges become: each parent → union, and union → each child.
- The union node shows one **baby badge** for the whole family (on the junction) and is not
  selectable / ignored by node clicks. It **is draggable**, so the user can reposition the junction
  (and thus the bus); a dragged junction's position is **persisted per tree in localStorage**
  (unions are not DB entities) and reused on the next layout.
- Parent→union and union→child edges are drawn as light orthogonal (elbow) lines. **No baby badge on
  the lines** (the badge sits on the junction). A small arrowhead marks the child end only.
- Spouse links keep today's behavior (horizontal, heart badge, marriage year, divorced styling).
- Stored relationships, export/import, and all CRUD are unchanged — this is purely how the
  parent-child graph is laid out and rendered.

## Architecture

### Client
- `src/utils/layout.ts` — rework `buildGraph`:
  - Group `PARENT_CHILD` rows into families keyed by the sorted parent-id set.
  - Add a `union` node per family (small size, e.g. 1×1) and feed dagre `parent → union` and
    `union → child` edges (instead of `parent → child`) so dagre positions the junction between
    generations. Tune `ranksep` so the extra union rank keeps generation spacing natural.
  - Return person nodes + union nodes; spouse edges unchanged. Parent/union edges carry no badge.
- `src/components/tree/nodes/UnionNode.tsx` — a minimal node: a tiny dot (or invisible) with a top
  `target` handle and a bottom `source` handle; `selectable={false}`, `draggable={false}` (set on the
  node in layout).
- `src/components/tree/edges/ParentChildEdge.tsx` — drop the `EdgeIconBadge` (baby); render a plain
  light `smoothstep` `BaseEdge`; arrow only on the union→child edge (via `markerEnd` set in layout).
- `src/components/tree/TreeCanvas.tsx` — register the `union` node type; selection effect and existing
  handlers ignore union nodes.
- `src/pages/TreePage.tsx` — `onNodeClick` already receives an id; guard so a non-person id (union)
  does nothing (no panel). (Union nodes are non-selectable anyway.)
- No change to `PersonNode`, services, hooks, types, or i18n.

### Server
No change.

## Data Model
None. Families and union nodes are computed at render time from existing `PARENT_CHILD` rows.

## UI / UX
- A couple with children shows one trunk dropping to a horizontal sibling bar, then a short drop to
  each child — instead of many crossing diagonals. Single parent: trunk from that parent.
- No baby icons on filiation links; thinner, calmer lines. Marriage hearts unchanged.
- Node selection, drag, search highlight, zoom level-of-detail: unchanged (union nodes excluded).

## Test Plan
### Web (Vitest)
- `layout.ts`:
  - Two parents + 3 children → one union node is created; dagre receives parent→union and union→child
    edges; no direct parent→child edges remain; parent-child edges carry no baby badge data.
  - Single parent + children → still one union with that parent.
  - A person with no relationships → no union node.
- `ParentChildEdge`: renders a path without an icon badge (no baby).

### Manual
- Build a couple with 4+ children → verify one clean trunk + sibling bar, no crossing fan, no baby
  icons; marriage heart still shown. Add a second couple/branch → still readable. Drag persons,
  search, zoom levels still work; union junctions are not clickable.

## Out of Scope
- Half-siblings nuance beyond grouping by exact parent set (children of different parent sets form
  separate families/buses, which is correct).
- Manical routing/space optimization beyond dagre + the union rank.
- Changing spouse link rendering or the data model.
- Collapsing/expanding branches.

## Open Questions
None.
