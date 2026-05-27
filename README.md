# Ancestry

Client-server web app for building, editing, and visually exploring family trees.

## Stack

- **Server**: Node.js 22, NestJS, Prisma, PostgreSQL.
- **Web**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Flow, TanStack Query.
- **Infra**: Docker Compose for local dev.

## Prerequisites

- Node.js >= 22 (use `nvm use` to match `.nvmrc`)
- Docker + Docker Compose — on macOS, see [docs/docker.md](docs/docker.md) for the Colima setup
- npm >= 10

## Quick start

1. Start PostgreSQL:
   ```bash
   docker compose up -d postgres
   ```

2. Install dependencies in each app:
   ```bash
   cd server && npm install && cd ..
   cd web && npm install && cd ..
   npm install
   ```

3. Copy environment files:
   ```bash
   cp server/.env.example server/.env
   cp web/.env.example web/.env
   ```

4. Run both apps in dev mode from the repo root:
   ```bash
   npm run dev
   ```

   - API on http://localhost:3100
   - Web on http://localhost:5173

## Useful commands

| Action | Command |
|---|---|
| Run both apps in dev | `npm run dev` |
| Build both apps | `npm run build` |
| Run all tests | `npm test` |
| Lint both apps | `npm run lint` |
| Server tests only | `cd server && npm test` |
| Web tests only | `cd web && npm test` |

## Project layout

```
.
├── claude.md           # Working agreement between Adrien and Claude
├── specs/              # Feature specifications (see specs/README.md)
├── server/             # NestJS API + Prisma
├── web/                # React + Vite frontend
└── docker-compose.yml  # Local dev stack
```

## Specs

Feature work is spec-driven. See [specs/README.md](specs/README.md) and use [specs/TEMPLATE.md](specs/TEMPLATE.md) as the starting point.
