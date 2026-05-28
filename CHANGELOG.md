# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Parent-child links not rendering: the family junction had no size, so its handles (and the
  connecting edges) didn't render — children appeared unlinked. The junction now keeps a real size.
- Selected/connecting person nodes no longer render blurry (removed the CSS scale on selection).
- Deployment: install OpenSSL in the server image and declare the `linux-musl-arm64-openssl-3.0.x`
  Prisma engine, so `prisma migrate deploy` works on the Alpine/ARM64 Raspberry Pi.

### Changed
- Parent-child links use a "family bus": a couple's children share one junction with a single
  branching connector instead of many crossing diagonals; the baby icon now appears once on the
  family junction instead of on every link. The junction is **draggable** (position saved per tree
  in localStorage) so the bus can be repositioned.
- The person detail panel lists each child with their birth date.
- Zoom-adaptive node detail: zoomed out shows only the name, a bit closer adds the photo, and
  closer still shows all fields — keeping content legible. Node size stays constant. The name font
  is counter-scaled when zoomed out so names stay readable at low zoom.
- Person name display: show whichever of family name / birth name is set; when both exist, show
  the family name followed by the birth name in parentheses (e.g. "Ada Lovelace (Byron)").

### Added
- Deployment: a GitHub Actions workflow deploys to a self-hosted Raspberry Pi runner on a push to
  the `release` branch or on a published Release (build images, run migrations, compose up). The web
  serves the app and reverse-proxies `/api` to the API (single origin). See `docs/deployment.md`.
- Marriage & divorce on spouse links: optional marriage date, a divorced flag and an optional
  divorce date, editable from the person panel and by clicking the link. The marriage year shows
  under the heart on the graph. Divorced marriages render faded/dotted with a broken-heart icon;
  the data is included in JSON export/import.
- Relationship edge icons: a small uniform badge at the middle of each link — a baby (blue) on
  parent-child edges, a heart (rose) on spouse edges — making links self-explanatory.
- Birth place autocomplete: the field suggests French communes live from geo.api.gouv.fr
  (no local list); picking one stores "Name (Department)". Manual free-text entry still works
  for renamed/missing/foreign places.
- Person photos: add a photo via file picker or drag-and-drop onto the photo zone (resized
  client-side, stored as a base64 data URL); shown as an avatar on the node and in the detail
  panel, and included in JSON export/import.
- Person search (Phase 3): a search box on the tree page lists matching persons (by given/family/
  birth name); picking one recenters the canvas on that node and highlights it.
- JSON import/export (Phase 2): export a tree to a versioned JSON file; import a file as a new tree
  or to replace an existing tree. Import is atomic and re-maps person ids. Validated server-side.
- Internationalization (FR/EN) with a flag language switcher; French by default, choice persisted
  in localStorage. All UI strings, validation messages, and server error codes are localized.
- Person extra fields: birth name, "living" flag (locks the death date; server rejects a living
  person with a death date), and birth place with an "uncertain" marker (shown as " ?" on the node).
- Gender colors on the graph: female nodes pink, male nodes blue, others neutral.
- Tree CRUD (Phase 1): full vertical slice from PostgreSQL to React Flow.

### Changed
- The person detail panel now closes after a person is created (previously it stayed open in edit mode).
- In edit mode, clicking Save closes the detail panel (debounced autosave while typing is unchanged).
  - Server: `Tree`, `Person`, `Relationship` REST endpoints under `/api`, validated with Zod;
    business rules for self/cross-tree/duplicate/cycle/mixed relationships; Prisma migration `init`.
  - Web: home page with tree list and creation dialog; tree canvas with dagre layout, draggable
    person nodes (position persisted), responsive detail panel (Sheet/Drawer), connect mode for
    linking persons, and a save-status toolbar.
- Local Docker engine guide for macOS via Colima (`docs/docker.md`).
- Monorepo scaffold with `server/` (NestJS + Prisma) and `web/` (React + Vite + TypeScript).
- Tailwind CSS and shadcn/ui primitives (Button, Drawer, Sheet, Dialog, Form, Input, Label) in `web/`.
- React Flow viewport on the web homepage as the rendering foundation for the family tree.
- Health check endpoint `GET /health` on the server.
- Docker Compose stack for local development (`postgres`, `api`, `web`).
- Root `npm` scripts to run both apps concurrently in dev mode.
