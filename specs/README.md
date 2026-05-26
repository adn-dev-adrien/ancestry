# Specs directory

This directory contains feature specifications for the Ancestry project.

## How to use it

- Create one file per feature: `/specs/<short-kebab-name>.md`.
- Use `/specs/TEMPLATE.md` as the starting point.
- Keep spec statuses up to date: `Draft`, `Approved`, `Implemented`.
- The spec is the canonical source of truth for the feature's behavior and architecture.

## Naming

Use short, descriptive kebab-case names. Examples:

- `tree-crud.md`
- `visualization-canvas.md`
- `tree-import-export.md`

## Working flow

1. Write the spec in this directory.
2. Have the user validate it.
3. Implement the feature based on the approved spec.
4. Move the spec status to `Implemented` when the work is done.
