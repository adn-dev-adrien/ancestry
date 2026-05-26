# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Monorepo scaffold with `server/` (NestJS + Prisma) and `web/` (React + Vite + TypeScript).
- Tailwind CSS and shadcn/ui primitives (Button, Drawer, Sheet, Dialog, Form, Input, Label) in `web/`.
- React Flow viewport on the web homepage as the rendering foundation for the family tree.
- Health check endpoint `GET /health` on the server.
- Docker Compose stack for local development (`postgres`, `api`, `web`).
- Root `npm` scripts to run both apps concurrently in dev mode.
