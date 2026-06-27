---
description: Developer tooling used in this repository — package manager, monorepo orchestration, linting/formatting, testing, database, git hooks, and helper scripts.
---

# Tooling

This document describes the **developer tooling** of the HMS monorepo: how to
install, run, lint, test, and contribute. For the application/runtime tech stack
(frameworks, libraries) see [`infrastructure.md`](infrastructure.md).

## Requirements

- **Node.js** `>= 18` (see `engines` in the root `package.json`)
- **pnpm** `9.0.0` (pinned via `packageManager`) — use `corepack enable` so the
  correct version is used automatically

## Monorepo layout

Managed as a pnpm workspace (`pnpm-workspace.yaml`):

- `apps/*` — `apps/web` (frontend), `apps/server` (backend)
- `packages/*` — `packages/core` (shared domain)

Run a script in a single workspace with `--filter`:

```
pnpm --filter web dev
pnpm --filter server dev
pnpm --filter @hms/core check-types
```

## Package manager — pnpm

- Install everything: `pnpm install`
- Add a dependency to a workspace: `pnpm --filter web add <pkg>`
- Add a workspace package as a dependency: `pnpm --filter server add @hms/core --workspace`
- `pnpm.onlyBuiltDependencies` in the root `package.json` allow-lists native
  packages permitted to run install scripts (`@swc/core`, `lightningcss`).

## Task orchestration — Turborepo

Configured in `turbo.json`. Root scripts fan out to every workspace:

| Root command         | Runs                                  |
| -------------------- | ------------------------------------- |
| `pnpm build`         | `turbo run build`                     |
| `pnpm dev`           | `turbo run dev` (persistent, no cache)|
| `pnpm lint`          | `turbo run lint`                      |
| `pnpm check-types`   | `turbo run check-types`               |
| `pnpm format`        | `biome format --write .`              |
| `pnpm check`         | `biome check --write .`               |

`build` and `check-types` declare `dependsOn: ["^build"]` / `["^check-types"]`, so
dependencies build before their dependents.

## Language — TypeScript

- TypeScript `5.9.2`, pinned at the root and per workspace.
- Each app/package owns its `tsconfig.json`:
  - `apps/web` — `moduleResolution: bundler`, `#/*` path alias, JSX.
  - `apps/server` — `moduleResolution: nodenext`, decorators (NestJS).
  - `packages/core` — `bundler` resolution; exposes subpaths via `exports` and
    internal `#identity/*` / `#shared/*` via `imports`.
- Type-check without emitting: `pnpm check-types` (or per workspace).

## Linting & formatting — BiomeJS

Single tool for both lint and format, configured in `biome.json` (schema `2.5.1`).

- **Formatter:** 2-space indent, line width **90**, single quotes, JSX single
  quotes, semicolons **as needed**. Tailwind CSS directives are recognized by the
  CSS parser.
- **Linter:** enabled with a curated rule set (most rules at `warn`); notable
  relaxations include `noExplicitAny: off` and `organizeImports: off` (import
  organization is handled by the editor on save, see `apps/web/.vscode`).
- Commands:
  ```
  pnpm format          # format the whole repo (write)
  pnpm check           # lint + format + safe fixes (write)
  pnpm --filter web lint
  pnpm --filter web check
  ```

## Testing — Vitest

Both apps use Vitest.

- `apps/web`: `pnpm --filter web test` (`vitest run`)
- `apps/server`:
  - `pnpm --filter server test` — unit
  - `pnpm --filter server test:watch` — watch mode
  - `pnpm --filter server test:cov` — coverage
  - `pnpm --filter server test:e2e` — uses `test/vitest-e2e.config.mts`

## Frontend tooling (`apps/web`)

- **Vite** (`vite dev --port 3000`, `vite build`, `vite preview`).
- **TanStack Router** route generation: `pnpm --filter web generate-routes`
  (`tsr generate`) — `routeTree.gen.ts` is generated and treated as read-only.
- **shadcn/ui**: components added via `pnpm --filter web shadcn add <name>`, output
  to `src/ui/shadcn/` (see `components.json`).

## Backend tooling (`apps/server`)

- **NestJS CLI**: `start` / `dev` (`--watch`) / `debug` / `build` (`nest build`) /
  `prod` (`node dist/main`).
- **Drizzle ORM (drizzle-kit)** for the database:
  ```
  pnpm --filter server db:generate   # generate migrations from schema
  pnpm --filter server db:migrate    # apply migrations
  pnpm --filter server db:push       # push schema directly (dev)
  pnpm --filter server db:studio     # open Drizzle Studio
  ```

## Local infrastructure — Docker Compose

`docker-compose.yaml` plus `volumes/` (auth email templates, DB roles/JWT SQL,
Kong gateway config) provide the local backing services (Supabase-style stack).
Bring it up with `docker compose up`.

## Git hooks — husky + commitlint

- **husky** installs git hooks; the `prepare` script (`husky`) runs automatically
  after `pnpm install`.
- **commit-msg hook** (`.husky/commit-msg`) runs **commitlint** to enforce
  Conventional Commits. See [`rules/commit-rules.md`](rules/commit-rules.md).
- Do not bypass hooks with `--no-verify`.

## Helper scripts (`scripts/`)

- `install-skills.sh` — installs the agent skills used in this repo
  (`frontend-design`, `caveman-commit`) via `npx skills add`.
- `sync-commands.sh` — turns the prompts in `documentation/prompts/*.md` into
  slash-command files for editors/agents (`.cursor/commands`, `.claude/commands`,
  `.opencode/commands`), symlinking when possible and copying as a fallback.

## Editor configuration

`apps/web/.vscode/settings.json` and the root `.vscode/settings.json` set Biome as
the default formatter, enable `organizeImports` on save, mark `routeTree.gen.ts` as
read-only/excluded, and force TypeScript to index workspace package subpath exports
(`typescript.preferences.includePackageJsonAutoImports: "on"`).
