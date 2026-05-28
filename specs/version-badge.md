# Build version badge (commit SHA)

## Status
Implemented

## Context
To know which commit a running front-end was built from (especially on the deployed Pi), we surface
the build's commit SHA in the UI.

## Goal
Display the commit SHA the web bundle was built from, in one place in the front-end.

## Functional rules
- The SHA is baked at **build time** (not fetched at runtime).
- Source order: `VITE_COMMIT_SHA` env (CI/Docker) → local `git rev-parse HEAD` → empty.
- Shown short (first 7 chars); when unknown, shows `dev`. Full SHA available on hover (title).

## Architecture
### Client
- `web/vite.config.ts` — `define: { __COMMIT_SHA__: JSON.stringify(commitSha()) }`, where `commitSha()`
  reads `process.env.VITE_COMMIT_SHA` or falls back to local git.
- `web/src/vite-env.d.ts` — `declare const __COMMIT_SHA__: string`.
- `web/src/components/VersionBadge.tsx` — renders `build <sha7>` (guarded with `typeof`).
- `web/src/pages/HomePage.tsx` — a footer renders `<VersionBadge />`.

### Build / deploy
- `web/Dockerfile` — `ARG VITE_COMMIT_SHA` + `ENV` so the value is present when Vite builds.
- `docker-compose.yml` — web build arg `VITE_COMMIT_SHA: ${VITE_COMMIT_SHA:-}`.
- `.github/workflows/deploy.yml` — writes `VITE_COMMIT_SHA=${{ github.sha }}` into `.env`.

## Data Model
None.

## Test Plan
- `VersionBadge` renders a "build …" label. Build + lint pass.
- Manual: the home footer shows `build <sha7>` matching the deployed commit.

## Out of Scope
- A runtime/version API endpoint; build timestamp; per-page placement beyond the home footer.

## Open Questions
None.
