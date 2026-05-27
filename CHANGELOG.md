# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
