# Relationship edge icons

## Status
Implemented

## Context
On the graph, parent-child and spouse links are only distinguishable by line style (solid+arrow vs
dashed). It is not obvious at a glance what a link means. We add a small icon badge at the middle of
each edge: a baby for parent→child links and a heart for spouse links, making relationships
self-explanatory. Front-end only — no data or server change.

## Goal
Each edge shows a small centered icon badge: 👶 (baby) on parent-child edges, ❤ (heart) on spouse
edges. Line styles stay as today (parent-child solid with an arrow at the child; spouse dashed).

## Functional rules
- Parent-child edge: solid line, arrow head at the child end, a **baby** icon badge at the midpoint.
- Spouse edge: dashed line, no arrow, a **heart** icon badge at the midpoint.
- Badges are decorative (`pointer-events: none`) and scale/position with the edge; they do not block
  node/edge interactions and follow pan/zoom like the rest of the canvas.
- No change to how edges are created/deleted or to the data model.

## Architecture

### Client
- `src/components/tree/edges/ParentChildEdge.tsx` — custom React Flow edge: `getSmoothStepPath`
  → `<BaseEdge path markerEnd style />` + `<EdgeLabelRenderer>` rendering a `Baby` (lucide) icon in a
  small rounded badge centered at the path's `labelX/labelY`.
- `src/components/tree/edges/SpouseEdge.tsx` — custom edge: `getStraightPath` → dashed `<BaseEdge>` +
  a `Heart` (lucide) badge at the midpoint.
- `src/utils/layout.ts` — change the built edge `type` to `'parentChild'` / `'spouse'` (keep the
  existing `markerEnd` for parent-child and the dashed `style` for spouse).
- `src/components/tree/TreeCanvas.tsx` — register `edgeTypes = { parentChild, spouse }` (module-level,
  stable) and pass to `<ReactFlow>`.
- Reuses existing lucide icons; no new dependency.

### Server
No change.

## Data Model
None.

## UI / UX
- **Uniform badge for both types:** the same component renders an identical circular badge
  (~20px, `background` fill, subtle `border`, centered) with the icon at the same size (~13px) and
  the same stroke width. Only the **color differs by type** for at-a-glance distinction:
  heart in a rose tone, baby in a blue tone. This keeps the two visually consistent despite the
  glyphs themselves differing in detail.
- A single shared `EdgeIconBadge` component (icon + color as props) guarantees identical framing.
- Badges remain legible on the canvas background and at moderate zoom; `pointer-events: none`.

## Test Plan
### Web (Vitest)
- `layout.ts`: parent-child edges have `type: 'parentChild'` and a `markerEnd`; spouse edges have
  `type: 'spouse'` and a dashed `style` (`strokeDasharray`).

### Manual
- Open a tree with a couple and children: each parent-child link shows a baby badge, the spouse link
  shows a heart badge; arrows/dashes unchanged; pan/zoom keeps badges centered; selecting/dragging
  nodes still works.

## Out of Scope
- Configurable/per-edge icons or colors.
- Icons for any future relationship types.
- Editing relationships by clicking the badge (badges are decorative only).

## Open Questions
None.
