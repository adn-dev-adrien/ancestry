# Docker engine (local, macOS)

This project uses Docker only for local infra (PostgreSQL via `docker compose`).
On macOS we run the Docker engine through [Colima](https://github.com/abiosoft/colima)
instead of Docker Desktop — lightweight, CLI-only, no licensing concerns.

## One-time install

```bash
brew install colima docker docker-compose
```

Wire the Compose plugin so `docker compose` is found (creates/updates `~/.docker/config.json`):

```json
{
  "cliPluginsExtraDirs": [
    "/opt/homebrew/lib/docker/cli-plugins"
  ]
}
```

## Daily commands

| Action | Command |
|---|---|
| Start the engine | `colima start` |
| Stop the engine | `colima stop` |
| Engine status | `colima status` |
| Start engine at login (background service) | `brew services start colima` |
| List running containers | `docker ps` |
| Check it works | `docker run --rm hello-world` |

> The Docker CLI talks to the Colima VM via the `colima` context.
> If `docker` commands hang or report "cannot connect", the engine is
> probably stopped — run `colima start`.

## Project stack

```bash
docker compose up -d postgres   # start PostgreSQL
docker compose ps               # show stack status
docker compose down             # stop the stack
```
