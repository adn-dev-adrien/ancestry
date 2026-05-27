# CLAUDE.md — Ancestry

Working agreement between Adrien and Claude on the Ancestry codebase.
This file is loaded into Claude's context for every session in this repo.

---

## 1. Project at a glance

**Ancestry** is a client-server web app for building, editing, and exploring family trees visually.

- **Frontend:** React + TypeScript + Vite.
- **Backend:** Node.js + NestJS + TypeScript.
- **Database:** PostgreSQL with Prisma migrations.
- **Deploy:** Docker / Docker Compose for local dev and production containers.

The repo follows a spec-driven, feature-by-feature workflow. See `/specs/` for feature specifications.

---

## 2. Working language

- **Conversation with the user:** French.
- **Code, comments, commit messages, PR descriptions, specs, docs:** English.

Never mix: a French commit or an English chat reply is a bug.

---

## 3. Collaboration workflow

The default loop is **spec-driven, plan-validated, autonomously implemented**.

### 3.1 Standard loop

1. **Discuss the need** in chat (French).
2. **Write the spec** in `/specs/<feature-name>.md` using `/specs/TEMPLATE.md`.
3. **User validates the spec.**
4. **Produce an implementation plan** describing files touched, DB impact, test plan, and UI changes.
5. **User validates the plan.**
6. **Implement** on the current branch: code, tests, UI verification, CHANGELOG update, spec status → `Implemented`.
7. **Hand off to the user** with a concise summary. The user handles git operations: branch, commit, push, PR.

### 3.2 When to skip the spec

Trivial changes do not need a `/specs/` entry:

- Typo fixes.
- Single-constant tweaks.
- One-line obvious bugfixes.
- Config adjustments with no functional impact.

If in doubt: write the spec.

### 3.3 Autonomy boundaries

After plan validation, drive implementation end-to-end without check-ins for each step. Pause only if:

- A non-trivial decision was not covered by the spec.
- A discovery contradicts the plan.
- A risky/destructive action becomes necessary.

### 3.4 Asking the user

For multi-option questions, use explicit choices in French. For free-form clarifications, plain French text is fine.

---

## 4. Specifications (`/specs/`)

- **Location:** `/specs/<short-kebab-name>.md`.
- **Template:** `/specs/TEMPLATE.md`.
- **Status field:** `Draft` → `Approved` → `Implemented`.
- **Spec sections:** Context, Goal, Functional Rules, Architecture, Data Model, UI / UX, Test Plan, Out of Scope, Open Questions.
- Architecture must list server and client layers touched or created, with one-line responsibility each.

The spec is the source of truth for *why*. Code answers *what*.

---

## 5. Git & branches

### 5.1 What Claude does

1. When a spec is approved, create a working branch from up-to-date `master`:
   ```bash
   git checkout master && git pull
   git checkout -b feature/<short-kebab-name>
   ```
2. Implement the spec on that branch.
3. Stage explicit files only — never `git add -A` or `git add .`.
4. Commit with a Conventional Commit message in English and include a brief bullet list.
5. Push to origin: `git push -u origin feature/<short-kebab-name>`.
6. Hand off the PR URL. The user creates the PR and reviews it.
7. After merge, return to master and pull:
   ```bash
   git checkout master && git pull
   ```

### 5.2 What Claude does NOT do

- Push to `master` directly.
- Force-push.
- Open, comment, or merge PRs.
- Push to `release` branch.
- Skip hooks or amend pushed commits.

### 5.3 Conventions

- Branches: `feature/<short-kebab-name>` for new work, `fix/<short-kebab-name>` for fixes.
- Target branch: `master`.
- Merge strategy: squash merge by user.

---

## 6. Architecture

### 6.1 Backend

- `src/app.module.ts` — application wiring.
- `src/modules/` — feature modules.
- `src/modules/<feature>/controllers/` — request handlers.
- `src/modules/<feature>/services/` — business logic.
- `src/modules/<feature>/repositories/` — database access.
- `src/common/` — shared pipes, guards, interceptors, DTOs.

Routes stay thin. Business logic belongs in services and repositories.

### 6.2 Frontend

- `src/pages/` — route-level views.
- `src/components/` — reusable UI components.
- `src/hooks/` — custom hooks.
- `src/services/` — API clients.
- `src/utils/` — helpers.
- `src/constants/` — enums and fixed values.

Components should be small and focused. Extract shared UI early.

---

## 7. Code conventions

### General

- No dead code or commented-out blocks.
- No comments that restate code behavior.
- Prefer existing files over creating new ones when possible.

### Frontend

- Render, don't compute.
- No business logic in React components. If a component needs derived data, add a backend endpoint.
- Keep local UI state local.

### Backend

- Validate inputs at boundaries.
- Keep controllers thin.
- Business rules go in services.
- Database access belongs in repositories.

---

## 8. Testing

### Backend tests

- Required for any business logic, validation, or schema-related change.
- Location: `server/src/**/*.spec.ts`.
- Run: `cd server && npm test`.

### Frontend verification

- Required for UI changes: run the app and exercise the feature.
- If browser testing is impossible, say so explicitly.

---

## 9. Documentation

### CHANGELOG.md

Maintain a changelog in Keep a Changelog style with an `Unreleased` section.

### README.md

Update only for user-facing setup, deployment changes, or headline features.

---

## 10. Communication style

- Concise updates: 2–3 sentences.
- Use markdown links for file references.
- Report completed changes and next steps.

---

## 11. Quick command reference

| Action | Command |
|---|---|
| Install server | `cd server && npm install` |
| Install web | `cd web && npm install` |
| Start dev | `npm run dev` |
| Backend tests | `cd server && npm test` |
| Build frontend | `cd web && npm run build` |

