# Auto-layout — generation rows, gender-ordered couples, centered children

## Status
Implemented

## Context
Today the canvas is laid out by dagre on first render, then the user is free to drag persons
anywhere — their positions are saved per person (`Person.x/y`) and per union (localStorage).
Two issues with this approach for genealogy:

- Dagre doesn't enforce one **generation per row**; cousins can end up at slightly different
  Y values, and "married-in" spouses drift around.
- It has no notion of **gender ordering** in a couple, so the woman ends up randomly to the
  left or to the right of the man.
- Children aren't always exactly centered under their parents (and the family bus tilts when
  manual drags happen).

Users want a one-click "tidy" that re-applies a deterministic family-tree layout.

## Goal
A new **Auto-layout** button in the toolbar re-positions every person of the current tree so that:
1. Each generation sits on its own horizontal row.
2. In every couple, the **woman is on the left**, the **man on the right**.
3. Children are placed in a single row exactly under the midpoint of their parents.
4. Edge lengths are minimal under those constraints (no extra crossings introduced by the
   algorithm; sibling order is chosen to keep linked branches close).

After the layout, every `Person.x/y` is saved on the server (in a single batched roundtrip), the
per-tree union positions are cleared (they're now derived from the persons), and the canvas
refreshes with the new positions.

## Functional rules

### Triggering
- A new toolbar button (Lucide `Wand2`, between *Fit view* and *Add person*).
- Clicking it shows a `window.confirm`:
  *"Réorganiser automatiquement les positions ? Les positions manuelles seront écrasées."*
- On confirm, the new positions are computed, every `Person.x/y` is sent in parallel
  (`Promise.all` of `savePosition.mutateAsync`), the union positions for that tree are removed
  from localStorage, then the tree query is invalidated.
- During the operation, the save status reads `saving`; on completion `saved` → `idle`.
- On any save error, an error toast appears (`showError`) and the local positions stay where
  they are (best-effort: partial successes are kept).

### Generations
- `level(p) = 0` for every person who is **not** the target of any `PARENT_CHILD` relationship
  in the tree.
- For every `PARENT_CHILD(parent → child)`, `level(child) = max(level(parent)) + 1`.
- For every `SPOUSE(a, b)`, both partners are lifted to `max(level(a), level(b))` so a couple
  always sits on the same row. The rules above are then re-applied (fixed-point iteration:
  monotone, bounded by the number of persons → converges).
- The Y of row `g` is `g * (NODE_HEIGHT + ROW_GAP)`, with `ROW_GAP = 120`.

### Couple ordering (left-right)
- For each `SPOUSE` row, the **woman is placed to the left of the man** within the couple.
- Tie-break when both partners share a gender, both are unknown, or one is unknown:
  alphabetical on `fullName` (using `localeCompare` with `fr` collation so `é < f`).
  - Special case: if exactly one partner is female and the other is unknown, the female still
    goes on the left.
  - If exactly one partner is male and the other unknown, the unknown goes on the left.
  - If both unknown or both same gender, pure alphabetical.
- A divorced couple **with no children** follows the same gender / alphabetical rule above —
  the divorce flag has no effect on placement when there is no chronology to anchor on.

### Multiple marriages (remarriage / shared partner)
A person `P` can be the partner of several `SPOUSE` rows at once (typically a divorce + a new
marriage, or successive partners with different children). `P` is rendered **once**; the spouses
sit on either side of `P`, with a separate family junction beneath each couple.

- For each couple `(P, S_i)` we compute its **anchor year**: the earliest birth year of the
  children shared with `S_i` (parents = `{P, S_i}`). Couples without shared children fall back
  to the `Relationship.marriageDate` year; couples with neither fall back to ID order so the
  layout stays deterministic.
- The couples are then placed **chronologically around `P`**: the oldest anchor on the far
  left of `P`, the youngest on the far right. With two marriages this gives `S_oldest – P –
  S_newest`. With three or more, the extras pile on the same side keeping the order
  (e.g. `S_1 – S_2 – P – S_3` for a marriage history where `P`'s third partnership is the
  most recent).
- Chronology wins over the gender rule when the two conflict. Inside a "non-shared" couple
  (only one marriage for both partners) the gender rule applies as usual.
- Each `(P, S_i)` couple still has its own family junction below, with their shared children
  centered under the couple's midpoint.

### Sibling order within a generation
- Children of the same family are placed left-to-right in **birth-date order** (oldest first;
  missing dates go to the end, ties broken alphabetically). This keeps the layout deterministic
  and matches how genealogical trees are usually drawn.

### Centering
- Each family unit (one couple or single parent + their children) is laid out recursively:
  1. **Bottom-up width pass**: for each unit, `width(unit) = max(parentsWidth(unit),
     childrenWidth(unit))`, where `childrenWidth = sum of children-unit widths + SIBLING_GAP`
     between them. Leaves (no children) take `parentsWidth`.
  2. **Top-down placement**: each unit is given an X range; the children are laid out
     left-to-right inside it; the parents (couple or single) are centered above the children's
     centerline.
- A "married-in" spouse (no parents in the data) is included in the family they marry into —
  they are placed on their spouse's row, adjacent to the spouse per the couple-ordering rule,
  and they don't start their own root.
- When a person `P` is shared between several couples (remarriage), every `(P, S_i)` family
  unit is laid out around `P`: each unit contributes its `childrenWidth` to one side of `P`
  according to the chronology rule above. `P`'s X is then the centroid of the whole structure
  (so the overall block stays balanced when placed in the larger forest).
- Roots (top-level family units with no parent-in-the-data) are laid out left-to-right with
  `FOREST_GAP` between them. Their order is stable (alphabetical on the earliest-born parent).

### Constants (initial values, tunable)
- `NODE_WIDTH = 176`, `NODE_HEIGHT = 76` — match the existing `layout.ts`.
- `SPOUSE_GAP = 40` — horizontal space between the two members of a couple.
- `SIBLING_GAP = 32` — between two sibling sub-trees.
- `ROW_GAP = 120` — vertical space between two generations.
- `FOREST_GAP = 120` — between two top-level family forests.

### Persistence
- Person positions: batched `PATCH /persons/:id { x, y }` via the existing
  `personMutations.savePosition`. Run in parallel (`Promise.all`).
- Union positions: `localStorage` entry `ancestry.union.<treeId>` is **removed** so the family
  junctions are recomputed by `buildGraph` against the new person positions (no stale manual
  drag overrides).
- No server schema change.

## Architecture

### Web
- `src/utils/autoLayout.ts` (new) — pure function
  `autoLayout(persons, relationships): Map<personId, { x, y }>`. No React Flow / DOM
  dependency. Unit-tested.
- `src/utils/unionPositions.ts` — add `clearUnionPositions(treeId: string)`.
- `src/components/tree/Toolbar.tsx`:
  - Add a `onAutoLayout` prop and a `Wand2` button (with `title="toolbar.autoLayout"`).
- `src/pages/TreePage.tsx`:
  - `onAutoLayout`: confirm → compute → `Promise.all` of `savePosition.mutateAsync` for every
    person whose position changes → `clearUnionPositions(treeId)` → invalidate.
- `src/i18n/locales/{fr,en}.json`:
  - `toolbar.autoLayout` (FR: "Réorganiser", EN: "Auto-layout"),
  - `tree.autoLayoutConfirm` (FR: "Réorganiser automatiquement les positions ? Les positions
    manuelles seront écrasées.", EN: equivalent).

### Server
- No change.

## Data Model
No schema change. Existing `Person.x/y` and the localStorage union map are reused.

## Test Plan

### Web (Vitest)
- `autoLayout.test.ts` — focused on behavior, not exact pixel values:
  - Empty input returns an empty map.
  - Two-generation family (couple → two kids): kids share the same Y (`level 1`); the parents
    share the same Y (`level 0`); the kids' midpoint X equals the parents' midpoint X.
  - Female on the left, male on the right within a couple.
  - Tie-break: same-gender couple → alphabetical (`Alice` left of `Brice`).
  - Three generations centered: a couple whose two children each have their own kids — the
    two parent-couples are themselves centered above their respective kids.
  - Married-in spouse with no ancestors: placed on their spouse's row (same Y) next to them
    per the gender rule.
  - Two disjoint forests sit side-by-side with `FOREST_GAP` between them, both at row 0.
  - **Remarriage with children on both sides**: a male `P` married `M` (their child born 1990)
    then `S` (their child born 2010). Result: `M` (oldest anchor) sits to the left of `P`,
    `S` (newest) to the right — the F-left rule is overridden by chronology. Each couple has
    its own family junction with its own children centered beneath.
  - **Remarriage with no shared children on one side but a marriage date**: anchor falls back
    to the `marriageDate` year; chronology still applies.
- `Toolbar.test.tsx` (extend or new) — clicking the auto-layout button triggers the prop
  callback.
- Manual canvas check: with a populated tree, click *Réorganiser* → generations on one row each,
  women on the left, children centered.

## Out of Scope
- Animated transition between old and new positions (instant snap is fine for v1).
- Handling cycles in `PARENT_CHILD` (rejected server-side already).
- Drawing the same person twice as a visual "alias" in the case of a remarriage — the spec
  keeps the single-node-per-person invariant; the chronology rule above is the layout choice.
- Multi-language fine collation tuning (we use `localeCompare(..., 'fr')`).
- An "undo" of the auto-layout: it overwrites positions; users can drag back manually.

## Open Questions
None.
