# Deployment to Raspberry Pi via GitHub Actions

## Status
Implemented

## Context
The app has Dockerfiles (server, web/nginx) and a `docker-compose.yml` with a `prod` profile, but
no automated deployment. The target is a Raspberry Pi (ARM64) running a **self-hosted GitHub Actions
runner**. We want: publishing a GitHub **Release** triggers a workflow that runs on the Pi, builds
the images natively, applies DB migrations, and (re)starts the stack — with persistent Postgres data.

To avoid baking the Pi's address into the web build and to remove CORS concerns, the whole app is
served from a **single origin**: the web's nginx serves the static site and reverse-proxies `/api`
to the API container. The browser then calls a relative `/api`, so no host/domain is hard-coded.

## Goal
Publishing a release deploys the current code to the Pi automatically:
1. Build the web and API images on the Pi (ARM-native).
2. Run `prisma migrate deploy` against the Postgres container.
3. Start/refresh `postgres`, `api`, `web` via docker compose; data persists across deploys.
4. The app is reachable at `http://<pi>:8080`, web and API on the same origin (`/api` proxied).

## Functional rules
- Trigger: `on: release: types: [published]` (publishing a GitHub Release/tag deploys). Also allow
  `workflow_dispatch` for a manual re-run.
- The job runs on the self-hosted runner (`runs-on: self-hosted`) installed on the Pi.
- Secrets/variables: `POSTGRES_PASSWORD` (GitHub Actions secret) is the DB password; the workflow
  writes a local `.env` (gitignored) consumed by compose. `VITE_API_URL` defaults to `/api`.
- Postgres data lives in the existing named volume (`ancestry-postgres-data`) and is **not** wiped
  on deploy.
- Migrations run before the API starts serving (`prisma migrate deploy`, never `migrate dev`).
- Single origin: the web container proxies `/api/` to `api:3000`; the API container need not be
  publicly exposed.

## Architecture

### CI/CD
- `.github/workflows/deploy.yml` — release-triggered, `runs-on: self-hosted`:
  1. `actions/checkout`.
  2. Write `.env` from secrets (`POSTGRES_PASSWORD`, derived `DATABASE_URL`).
  3. `docker compose --profile prod build` (web build arg `VITE_API_URL=/api`).
  4. `docker compose --profile prod up -d postgres` then
     `docker compose --profile prod run --rm api npx prisma migrate deploy`.
  5. `docker compose --profile prod up -d` (api + web).
  6. `docker image prune -f`.
- A separate lightweight CI workflow is **out of scope** here (this spec is deployment only).

### Compose / images (changes)
- `docker-compose.yml` (prod profile):
  - `postgres.environment.POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ancestry}`.
  - `api.environment.DATABASE_URL: postgres://ancestry:${POSTGRES_PASSWORD:-ancestry}@postgres:5432/ancestry`.
  - `web.build.args.VITE_API_URL: ${VITE_API_URL:-/api}`; `web` depends on `api`.
  - Keep the named Postgres volume; web published on `8080:80`.
- `web/Dockerfile` — accept `ARG VITE_API_URL` and expose it as an env var before `npm run build`
  so Vite bakes the relative API base.
- `web/nginx.conf` — add `location /api/ { proxy_pass http://api:3000; … }` (preserve the `/api`
  prefix, set proxy headers) alongside the SPA fallback.
- `server` image already bundles Prisma + schema, so `prisma migrate deploy` runs in the api container.

### Docs
- `docs/deployment.md` — one-time setup (install Docker + the self-hosted runner on the Pi, set the
  `POSTGRES_PASSWORD` secret), how to deploy (publish a Release), where to access it, and rollback
  (re-run a previous release / `docker compose` notes).

### App code
- No application code change. `VITE_API_URL` already drives the API base in `web/src/services/api.ts`;
  setting it to `/api` makes the browser call the same origin.

## Data Model
None.

## Test Plan
- CI/workflow can't be unit-tested here; validate by:
  - `docker compose --profile prod config` parses with the new variables.
  - Locally (or on the Pi) `docker compose --profile prod build` succeeds and
    `docker compose --profile prod up -d` serves the app at `http://localhost:8080`, with the web
    calling `/api` successfully (same origin) and migrations applied.
- Manual on the Pi: publish a test release → the workflow runs on the runner, the stack comes up,
  data persists across a second release.

## Out of Scope
- HTTPS/TLS, a public domain, or a reverse proxy in front of the Pi (can be added later).
- Pushing images to a registry (GHCR) — build happens on the Pi.
- Zero-downtime/blue-green deploys and DB backups automation.
- A separate test/lint CI pipeline (separate task).

## Open Questions
None (HTTPS/domain deliberately deferred; access over `http://<pi>:8080` for now).
