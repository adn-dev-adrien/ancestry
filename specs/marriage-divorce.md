# Marriage & divorce on spouse links

## Status
Implemented

## Context
Spouse links carry no detail today. Genealogy needs marriage dates and the ability to record a
divorce (with its date), and to tell a current marriage apart from a past (divorced) one at a glance.
We extend `SPOUSE` relationships with optional marriage/divorce data, an editor reachable both from
the person panel and by clicking the link, and a faded "broken-heart" rendering for divorced links
so the valid marriage stands out.

## Goal
1. A spouse relationship can hold an optional marriage date, a `divorced` flag, and an optional divorce date.
2. The user edits these from the person detail panel (spouses list) **and** by clicking the marriage link on the graph.
3. Divorced links render faded/dotted with a broken-heart icon; valid marriages keep the solid rose heart.
4. Everything optional; existing spouse links are unaffected (no marriage data, not divorced).

## Functional rules
- New `Relationship` fields (meaningful for `SPOUSE` only): `marriageDate` (`YYYY-MM-DD`|null),
  `divorced` (boolean, default false), `divorceDate` (`YYYY-MM-DD`|null).
- Validation:
  - `marriageDate ≤ divorceDate` when both set.
  - `divorceDate` may be set only when `divorced` is true; if `divorced` is false, `divorceDate` must be null.
  - These fields are only valid on `SPOUSE` relationships; updating a `PARENT_CHILD` relationship with
    them → HTTP 409 (`MIXED_RELATIONSHIP_PAIR` is unrelated; use a new guard returning 400/409 — see below).
- The single-spouse-per-pair and no-cycle rules are unchanged. Creating a spouse link still works with
  no marriage data; details are added later via edit.
- Marriage/divorce data is included in JSON export and restored on import.

## Architecture

### Server
- `prisma/schema.prisma` — add `marriageDate String?`, `divorced Boolean @default(false)`,
  `divorceDate String?` to `Relationship`; migration `add_marriage_divorce`.
- `src/modules/relationships/dto/relationship.dto.ts` — add `updateRelationshipSchema`
  (`marriageDate?`, `divorced?`, `divorceDate?`) with a `.refine` for the two date rules above.
- `src/modules/relationships/services/relationships.service.ts` — `update(id, dto)`: 404 if missing;
  reject if the relationship is not `SPOUSE` (`BusinessRuleException` 409, new code
  `NOT_A_SPOUSE_RELATIONSHIP`); persist the fields.
- `src/modules/relationships/controllers/relationships.controller.ts` — `PATCH /api/relationships/:id`.
- `src/common/errors/business.exceptions.ts` — add the `NOT_A_SPOUSE_RELATIONSHIP` code.
- `src/modules/trees/services/import-export.service.ts` + `dto/import.dto.ts` — include the three
  fields in the exported relationship and accept them on import.

### Client
- `src/services/types.ts` — add `marriageDate`, `divorced`, `divorceDate` to `Relationship`.
- `src/services/relationships.ts` — `updateRelationship(id, body)`.
- `src/hooks/useRelationshipMutations.ts` — add an `update` mutation (invalidate the tree).
- `src/components/tree/MarriageEditor.tsx` — a dialog editing one spouse relationship: marriage date,
  "divorced" checkbox (enables the divorce-date input), divorce date; Save. Mirrors the server rules.
- `src/utils/relationships.ts` — add `spouseRelationships(personId, relationships)` returning the
  `SPOUSE` relationship rows (id + partner id + marriage data) for the panel list.
- `src/components/tree/PersonDetailPanel.tsx` — the Spouses list shows partner name + marriage/divorce
  summary; each row opens the `MarriageEditor`.
- `src/components/tree/TreeCanvas.tsx` — `onEdgeClick`: for a `spouse` edge, call `onSpouseEdgeClick(id)`.
- `src/pages/TreePage.tsx` — hold the editing relationship; open `MarriageEditor` from panel rows or
  edge clicks; wire the update mutation.
- `src/utils/layout.ts` — spouse edge carries `data: { divorced }`; the edge owns its styling.
- `src/components/tree/edges/SpouseEdge.tsx` — when `data.divorced`, render faded + dotted line and a
  `HeartCrack` (greyed) badge; otherwise the current rose `Heart`.
- `src/i18n/locales/{fr,en}.json` — keys: marriage date, divorced, divorce date, editor title, and a
  short marriage/divorce summary format.

## Data Model
`Relationship` gains `marriageDate String?`, `divorced Boolean @default(false)`, `divorceDate String?`.
Export relationship objects gain the same optional fields.

REST: `PATCH /api/relationships/:relationshipId` body `{ marriageDate?, divorced?, divorceDate? }`
→ `Relationship` (200); 404 if missing; 409 (`NOT_A_SPOUSE_RELATIONSHIP`) for a non-spouse link;
400 on date-rule violations.

## UI / UX
- **Spouses list (panel):** each row = partner name + a muted summary (e.g. `⚭ 1990` or
  `⚭ 1990 · ⚯ 2005`); a click/edit affordance opens the editor.
- **Edge click:** clicking a marriage link opens the same editor for that relationship.
- **Editor dialog:** marriage date, a "Divorced" checkbox; the divorce-date input is enabled only when
  divorced; Save persists.
- **Graph:** valid marriage = solid-ish line + rose `Heart` badge; divorced = paler dotted line +
  greyed `HeartCrack` badge, so the current valid marriage reads clearly.
- Localized (FR default).

## Test Plan
### Server (Jest)
- `relationship.dto`: rejects `divorced:false` + a `divorceDate`; rejects `marriageDate > divorceDate`;
  accepts a lone `marriageDate`.
- `relationships.service`: `update` rejects a non-spouse relationship (409); persists valid fields; 404 when missing.
- e2e: create spouse → PATCH marriage date → PATCH divorced+date → GET reflects it; export/import round-trip keeps the fields.

### Web (Vitest)
- `relationships.ts`: `updateRelationship` PATCHes the right URL.
- `utils/relationships.ts`: `spouseRelationships` returns the spouse rows for a person.
- `MarriageEditor`: the divorce-date input is disabled until "Divorced" is checked; Save calls the
  mutation with the entered values.
- `layout.ts`: spouse edges carry `data.divorced`.

### Manual
- Add a couple, open the spouse from the panel → set a marriage date → link unchanged but summary shows it.
- Mark divorced + date → link becomes faded/dotted with a broken heart; a second (current) marriage stays solid.
- Click a marriage link on the graph → same editor opens. Export/import keeps the data. Toggle language.

## Out of Scope
- Engagement/partnership types beyond married/divorced.
- Showing marriage/divorce dates as text directly on the graph (kept in panel/editor; the link only
  reflects valid vs divorced).
- Multiple marriages between the *same* pair (still one spouse record per pair).
- Deleting a marriage from the editor (existing delete paths unchanged).

## Open Questions
None.
