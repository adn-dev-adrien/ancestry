# Deployment — Raspberry Pi via GitHub Actions

The app is deployed to a Raspberry Pi (ARM64) running a **self-hosted GitHub Actions runner**.
Publishing a GitHub **Release** triggers [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml),
which runs on the Pi, builds the images natively, applies DB migrations, and (re)starts the stack.

The whole app is served from a single origin: the web's nginx serves the static site and
reverse-proxies `/api` to the API container, so the browser calls a relative `/api` (no Pi
address baked at build time, no CORS).

## One-time setup on the Pi

1. **Install Docker + Compose plugin** (Raspberry Pi OS 64-bit):
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker "$USER"   # then re-login
   ```
2. **Install the self-hosted runner**: GitHub → repo **Settings → Actions → Runners → New
   self-hosted runner** → follow the Linux/ARM64 instructions. Install it as a service so it
   survives reboots:
   ```bash
   ./svc.sh install && ./svc.sh start
   ```
   The default `self-hosted` label is what the workflow targets.
3. **Set the DB password secret**: repo **Settings → Secrets and variables → Actions → New
   repository secret** → `POSTGRES_PASSWORD` = a strong password.
   (Optional repository **variable** `CORS_ORIGIN` if you later expose the app on a real host;
   not needed for same-origin access.)

## Deploy

- Publish a **Release** (GitHub → Releases → Draft a new release → choose/create a tag → Publish).
  The workflow runs on the Pi and updates the stack. You can also trigger it manually from the
  **Actions** tab (**Run workflow**).

What the workflow does (all on the Pi):
1. `docker compose --profile prod build` — builds the web and API images (ARM-native).
2. `docker compose --profile prod up -d postgres` — starts Postgres.
3. `docker compose --profile prod run --rm api npx prisma migrate deploy` — applies migrations.
4. `docker compose --profile prod up -d` — starts/refreshes `api` and `web`.
5. Prunes dangling images.

## Access

- Web app: `http://<pi-host>:8080`
- API (direct, optional/debug): `http://<pi-host>:3100/api/health`

## Data & persistence

- Postgres data lives in the named volume `ancestry-postgres-data` and **survives redeploys**.
- Back up with:
  ```bash
  docker exec ancestry-postgres pg_dump -U ancestry ancestry > backup.sql
  ```

## Rollback

- Re-run the workflow for a previous release (Actions → that run → Re-run), or check out the
  previous tag on the Pi and run the compose commands above manually.

## Notes / not included yet

- No HTTPS/TLS or public domain — add a reverse proxy (e.g. Caddy/Traefik) in front of `:8080`
  later if needed (then set the `CORS_ORIGIN` variable accordingly).
- Images are built on the Pi (no registry).
