# Relationship deletion — graph edge & in-panel trash

## Status
Implemented

## Context
Today, selecting an edge in the canvas and pressing **Delete/Backspace** removes it from React
Flow's local state only — the next layout rebuild brings it back because the underlying
`Relationship` row is still in the database. There is also no way to **delete an existing
relationship from the person fiche**: the lists of parents, children and spouses are read-only.

We want both paths to actually delete the underlying relationship(s):

1. From the graph: deleting an edge persists the deletion.
2. From the fiche: a small trash icon on the right of each parent / child / spouse row
   deletes that relationship.

## Goal
- Deleting a graph edge calls `DELETE /relationships/:id` for every `Relationship` row it
  represents, then the canvas reflects the new state on the next refetch.
- Deleting a row in the fiche via the trash icon removes the corresponding `Relationship` row.
- Both paths confirm with `window.confirm` (same UX as deleting a person).

## Functional rules

### Graph edge deletion semantics
- **Spouse edge** — represents exactly one `SPOUSE` row (`edge.id === relationship.id`). Deleting
  it removes that single row.
- **Parent → union edge** — represents *that one parent's parenthood of every child of the
  family*. Deleting it removes every `PARENT_CHILD` row where `source = parentId` and
  `target ∈ familyChildren`. (The other parent keeps their links to the children.)
- **Union → child edge** — represents *that one child's link to both parents of the family*.
  Deleting it removes every `PARENT_CHILD` row where `target = childId` and
  `source ∈ familyParents`. (The other children keep both their parents.)
- This is the "branch pointed at" interpretation: the spec rules out the "blow up the entire
  family" alternative as too destructive.

A confirmation prompt is shown before any deletion:
- Spouse: "Supprimer la relation conjugale avec {{name}} ?"
- Parent→union: "Supprimer ce parent pour {{n}} enfant(s) ?"
- Union→child: "Supprimer les deux parents de {{name}} ?"

After confirmation, the relationship IDs to delete are submitted in parallel (`Promise.all`),
then the tree query is invalidated so `buildGraph` rebuilds the canvas — orphan unions and
edges disappear automatically.

### Fiche trash icons
- Each row of the **Parents**, **Children** and **Spouses** lists in `PersonDetailPanel` gets a
  small `Trash2` icon button **on the right** (after the existing date/marriage summary).
- Clicking it confirms ("Supprimer la relation avec {{name}} ?") then deletes the matching
  `Relationship` row:
  - In the **Parents** list of person P: delete the `PARENT_CHILD` row where `source = parentId`
    and `target = P.id`.
  - In the **Children** list of person P: delete the row where `source = P.id` and
    `target = childId`.
  - In the **Spouses** list of person P: delete the row directly (we already have the relationship).
- The icon button stops click propagation so clicking the spouse row (which opens the marriage
  editor) still works on the rest of the row.

### Out of scope
- Cascading deletions across SPOUSE & PARENT_CHILD (a spouse deletion does not touch the
  couple's PARENT_CHILD rows, and vice versa).
- Multi-select / bulk delete in the canvas.
- Undo: there is no undo system yet; the confirmation prompt is the only safeguard.

## Architecture

### Web
- `src/utils/layout.ts` — embed extra data on parent-child edges so they can be resolved to
  relationship IDs without re-parsing the edge id:
  - parent→union: `data: { kind: 'parent-of-family', parentId, childrenIds }`
  - union→child: `data: { kind: 'family-of-child', parentIds, childId }`
  - spouse edges already carry the relationship id as `edge.id`.
- `src/utils/edgeDeletion.ts` (new) — `relationshipIdsForEdge(edge, relationships): string[]`,
  unit-tested.
- `src/components/tree/TreeCanvas.tsx`:
  - Add an `onEdgeDelete: (edge: Edge) => void` prop.
  - Pass an `onEdgesDelete` handler to React Flow that forwards each removed edge.
- `src/pages/TreePage.tsx`:
  - Implement the canvas handler: build the confirm message from the edge kind and the
    affected people, then call `relationshipMutations.remove.mutateAsync` for each id
    (in `Promise.all`).
- `src/components/tree/PersonDetailPanel.tsx`:
  - `RelativeList` accepts a `onDelete(id)` callback and renders a trash icon button per row
    when provided; the existing date/marriage summary stays.
  - `SpouseList` accepts a `onDelete(relationship)` callback and renders the icon next to the
    marriage summary; the icon stops propagation so the row click still opens the editor.
  - `PersonDetailPanel` exposes new props `onDeleteParent(personId, parentId)`,
    `onDeleteChild(personId, childId)`, `onDeleteSpouse(relationship)` (resolved in `TreePage`).
- `src/i18n/locales/{fr,en}.json` — new keys `panel.remove`,
  `panel.removeParentConfirm`, `panel.removeChildConfirm`, `panel.removeSpouseConfirm`,
  `tree.removeBranchParentConfirm`, `tree.removeBranchChildConfirm`,
  `tree.removeSpouseLinkConfirm`.

### Server
- No change. The existing `DELETE /relationships/:id` endpoint is enough; deletions happen in
  parallel client-side.

## Data Model
No schema change.

## Test Plan

### Web (Vitest)
- `edgeDeletion`:
  - Spouse edge → returns `[relationshipId]`.
  - Parent→union edge → returns every PARENT_CHILD row from that parent to the family's
    children (and nothing else).
  - Union→child edge → returns every PARENT_CHILD row to that child from the family's parents.
  - Unknown edge type → returns `[]`.
- `layout.test`: extend the family-bus case to assert that parent→union and union→child edges
  carry the new `data` shape.
- `PersonDetailPanel` (new test file or extend an existing one): rendering the panel with a
  person who has a parent / child / spouse shows a trash button per row; clicking it asks for
  confirmation (mock `window.confirm`) and calls the corresponding `onDelete*` prop with the
  right ids.

### Manual
- Delete an edge between a parent and the union → the parent loses every child of that family.
- Delete an edge between the union and a child → the child loses both parents from that family.
- Delete a spouse edge → spouse link gone; the children's PARENT_CHILD rows are unaffected.
- Use the trash button in the parents / children / spouses lists → confirm, then the
  relationship disappears from the fiche and the graph.

## Out of Scope
- Cascading PARENT_CHILD deletion on spouse removal.
- Bulk multi-edge selection in the canvas.
- Undo of relationship deletion.

## Open Questions
None.
