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
- `packages/*` — `packages/core` (shared domain) and `packages/validation`
  (shared Zod schemas)

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
| `pnpm start`         | `docker compose up -d` then `turbo run dev` |
| `pnpm build`         | `turbo run build`                     |
| `pnpm dev`           | `turbo run dev` (persistent, no cache)|
| `pnpm lint`          | `turbo run lint`                      |
| `pnpm test`          | `turbo run test`                      |
| `pnpm check-types`   | `turbo run check-types`               |
| `pnpm format`        | `biome format --write .`              |
| `pnpm check`         | `biome check --write .`               |

`build` and `check-types` declare `dependsOn: ["^build"]` / `["^check-types"]`, so
dependencies build before their dependents.

## Language — TypeScript

- TypeScript `5.9.2`, pinned at the root and per workspace.
- Each app/package owns its `tsconfig.json`:
  - `apps/web` — `moduleResolution: bundler`, `@/*` path alias, JSX.
  - `apps/server` — `moduleResolution: nodenext`, decorators (NestJS).
  - `packages/core` — `bundler` resolution; exposes subpaths via `exports` and
    internal `#identity/*` / `#shared/*` via `imports`.
- Type-check without emitting: `pnpm check-types` at the monorepo level, or the
  workspace-specific `check:types` script for `apps/web` and `apps/server`.

## Linting & formatting — BiomeJS

Single tool for both lint and format, configured in `biome.json` (schema `2.5.1`).

- **Formatter:** 2-space indent, line width **90**, single quotes, JSX single
  quotes, semicolons **as needed**. Tailwind CSS directives are recognized by the
  CSS parser.
- **Linter:** enabled with a curated rule set (most rules at `warn`); notable
  relaxations include `noExplicitAny: off` and `organizeImports: off` (import
  organization is handled by the editor on save, see `apps/web/.vscode`).
- **Complexity checks:** `code-multivitals` compares the current source metrics
  with `.code-multivitals-baseline.json.gz`; update the compressed shared baseline with
  `pnpm update:complexity-baseline` when intentionally accepting new complexity.
- Commands:
  ```
  pnpm format          # format the whole repo (write)
  pnpm check           # lint + format + safe fixes (write)
  pnpm --filter web check:lint
  pnpm --filter web check:types
  pnpm --filter server check:lint
  pnpm --filter server check:types
  pnpm check:complexity
  ```

The application workspaces keep lint and type validation as separate checks:

- `check:lint` runs Biome checks;
- `check:types` runs TypeScript without emitting files.

The shared packages currently retain their package-specific `lint` and
`check-types` scripts.

## Testing — Vitest

The application and core workspaces use Vitest for automated tests.

- `apps/web`: `pnpm --filter web test` (`vitest run`)
- `apps/server`:
  - `pnpm --filter server test` — unit and REST integration tests
  - `pnpm --filter server test:watch` — watch mode
  - `pnpm --filter server test:coverage` — coverage
  - `pnpm --filter server test:e2e` — uses `test/vitest-e2e.config.mts`
- `packages/core`: `pnpm --filter @hms/core test` (`vitest run`)
- `pnpm test` runs the test task across all workspaces through Turborepo.

Server REST integration tests use Testcontainers and are configured with
`fileParallelism: false`. Vitest global setup starts PostgreSQL and Supabase Auth
once per run. Each database fixture clones a migrated template into an isolated
database; each file starts with cleared Auth users and Mailpit messages. Global
teardown stops the run-owned containers. Inngest fixtures keep dedicated function
registrations. This avoids repeating container startup and migrations for every
controller file while preserving real service coverage.

Run container-backed server suites sequentially across commands as well as within
Vitest. Several simultaneous Vitest processes bypass `fileParallelism: false`
and can trigger Docker port-binding timeouts. Confirm the service startup error
before classifying a failure as infrastructure-related, then rerun only the
affected files sequentially. Record both the initial failure and the rerun; a
focused passing rerun does not turn the original full run into a green run.

### Web integration in SDD

Only `implement-spec` runs `pnpm --filter web test:integration` locally, once per delivery
when applicable, after focused browser checks pass. Record the attempt, outcome,
measured implementation, and artifacts in Evaluation. Failed or interrupted
attempts count; resumes and corrections do not reset the allowance. Later fixes
use focused Playwright CLI tests for affected routes and scenarios. Conclusion,
commit, and publication reuse the local full-suite evidence. CI independently
runs the full Web integration suite on every applicable PR head. A separate local
full refresh requires an explicit user request.
Continue to validate required real REST/Auth, viewport, keyboard, console/network,
and acceptance behavior; label earlier full-suite results historical after changes.

### Test coverage reports

Core, Server, and Web run Vitest with V8 coverage. The configured source globs
include production files even when tests do not import them. Tests, test
fixtures, Core fakers and barrels, and generated Web route metadata are excluded
where applicable. Run all three workspaces with `pnpm test:coverage`, or run one
with `pnpm --filter @hms/core test:coverage`, `pnpm --filter server test:coverage`,
or `pnpm --filter web test:coverage`.

Each workspace prints a text summary and writes ignored JSON, HTML, and LCOV
reports under its `coverage/` directory. Floors reflect measured current `develop`
baselines (Server and Web remeasured 2026-09-29 after restored source surfaces). Vitest
currently reports coverage without blocking on these floors while legacy coverage
debt is addressed. The values below are measured baselines, not enforced thresholds;
update the table and workspace configs together when enforcement is restored.
Automatic threshold updates are disabled; raise a floor when sustained coverage
improves. The longer-term target is 85% for statements, functions, and lines and
80% for branches. Coverage percentages supplement behavioral and integration
evidence; they do not establish that an acceptance criterion is complete.

| Workspace | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Core floor | 70.3% | 61.5% | 68.9% | 73.5% |
| Server floor | 50.8% | 40.6% | 54.3% | 51.6% |
| Web floor | 46.8% | 45.3% | 43.7% | 48.3% |
| Longer-term target | 85% | 80% | 85% | 85% |

Latest local measurements, taken on 2026-10-03, are separate from those reference
floors and do not change the configured thresholds:

| Workspace | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Core | 72.62% | 62.93% | 72.15% | 76.25% |
| Server | 66.92% | 53.53% | 74.61% | 68.27% |
| Web | 46.99% | 45.40% | 43.92% | 48.47% |

Core completed with 129 files and 417 tests passing. Web completed with 100 files,
371 tests passing, and 3 skipped on the full rerun after a dialog test timeout.
The latest Server coverage run completed with 122 files passing and 3 Storage
files failing: 270 tests passed and 3 failed because global service setup left
its temporary Auth URL in the environment. Global setup now restores the
original environment before workers start. All 11 tests across the 3 affected
Storage files, Auth sign-in, and parameterized document-exception review passed
on a focused rerun. The full coverage suite was not rerun after that correction;
the Server percentages above belong to the failing full run.

When reporting coverage, read each workspace's
`coverage/coverage-summary.json` and state the measurement date, test outcome,
and whether the command ran the complete suite or a subset. Check artifact
freshness: a saved report may predate the current changes, and Vitest clears old
artifacts when a new coverage run starts. Label old reports as the latest saved
measurement rather than current coverage. A failing run can still emit coverage;
report its failures alongside the percentages.

Use focused tests for routine changes. A request to refresh whole-workspace
coverage requires a complete coverage run; focused coverage cannot replace that
measurement. Stop repeating broad coverage once it has produced the requested
report unless a concrete remaining risk requires another run. Server's full
coverage run on 2026-10-03 decreased from 38m 6s to 14m 43s after reusing
run-owned PostgreSQL and Auth services, about 61% faster. The latter command took
14m 55s of wall time including command startup and shutdown. These are local
measurements, not GitHub Actions job durations; the faster full run had the 3
Storage failures described above, corrected and verified in a focused rerun.

In local SDD execution, only `implement-spec` runs coverage, once per affected workspace per
delivery. Record the attempt and report in Evaluation, including failed or
interrupted attempts. Resumes, corrections, amendments, commits, and conclusion
retries reuse that record. Later corrections use focused tests without coverage;
label the original percentages historical when the measured implementation has
changed. A separate coverage refresh requires an explicit user request.

Core, Server, and Web PR workflows independently run tests with coverage and all
applicable quality gates on each current PR head. Web CI also runs its full
integration suite. CI publishes coverage summaries, PR comments, and report
artifacts. The local single-run policy does not limit CI. `conclude-spec`,
`commit-code`, and `create-pr` reuse implementation evidence and run only missing
or invalidated local checks without coverage.

## CI/CD — GitHub Actions and Coolify

- `.github/workflows/core-package-ci.yaml` validates the shared core package on PRs.
- `.github/workflows/server-app-ci.yaml` validates and builds the server on PRs.
- `.github/workflows/web-app-ci.yaml` validates and builds the web app on PRs.
- `.github/workflows/server-app-production-cd.yml` applies production Drizzle migrations and
  then triggers the server production Coolify webhook with `COOLIFY_API_TOKEN` after a
  merged PR into `main`.
- `.github/workflows/server-app-staging-cd.yml` applies staging Drizzle migrations,
  resets and seeds staging, and then triggers the server staging Coolify webhook
  with `COOLIFY_API_TOKEN` after pushes to `develop`.
- `.github/workflows/web-app-staging-cd.yml` deploys web staging after pushes to
  `develop` using `COOLIFY_API_TOKEN`.
- `.github/workflows/web-app-production-cd.yml` deploys web production after a merged
  PR into `main` using `COOLIFY_API_TOKEN`.
- `.github/workflows/release-production.yml` creates the version tag and GitHub Release
  from the merged PR title and description.

The `production` and `staging` GitHub environments must provide these secrets:

- `COOLIFY_API_TOKEN`
- `COOLIFY_WEBHOOK_HMS_WEB_APP_PROD` and `COOLIFY_WEBHOOK_HMS_WEB_APP_STG`
- `COOLIFY_WEBHOOK_HMS_SERVER_APP_PROD` and `COOLIFY_WEBHOOK_HMS_SERVER_APP_STG`
- `DATABASE_URL_PRODUCTION` and `DATABASE_URL_STG`
- `HMS_USER_SEED_PASSWORD_STG`
- `HMS_WEB_APP_URL_STG`
- `SUPABASE_URL_STG`
- `SUPABASE_SERVICE_ROLE_KEY_STG`


## Frontend tooling (`apps/web`)

- **Vite** (`vite dev --port 3000`, `vite build`, `vite preview`).
- **TanStack Router** route generation: `pnpm --filter web generate-routes`
  (`tsr generate`) — `routeTree.gen.ts` is generated and treated as read-only.
- **shadcn/ui**: components added via `pnpm --filter web shadcn add <name>`, output
  to `src/ui/shadcn/` (see `components.json`).

## Backend tooling (`apps/server`)

- **NestJS CLI**: `start` / `dev` (`--watch`) / `debug` / `build` (`nest build`) /
  `prod` (`node dist/main`).
- The Nest compiler uses `apps/server/webpack.config.cjs` to include the local
  `@hms/core` and `@hms/validation` workspace packages in the server bundle.
  Other Node dependencies remain external. This ensures production executes
  compiled JavaScript instead of trying to load workspace TypeScript sources
  directly.
- **Drizzle ORM (drizzle-kit)** for the database:
  ```
  pnpm --filter server db:migration:generate  # generate migrations from schema
  pnpm --filter server db:migration:apply     # apply migrations
  pnpm --filter server db:schema:push        # push schema directly (dev)
  pnpm --filter server db:studio     # open Drizzle Studio
  pnpm --filter server db:seed       # reset and seed dev/staging through Nest
  ```

The seed entrypoint must run through the Nest compiler so emitted decorator
metadata remains available to the application context. Do not execute it directly
with `tsx`.

## Local infrastructure — Docker Compose

`docker-compose.yaml` plus `volumes/` (auth email templates, DB roles/JWT SQL,
Kong gateway config) provide the local backing services (Supabase-style stack).
`pnpm start` brings up the stack in the background and starts the web and server
development processes. Use `docker compose up` when you only need the backing
services, or `pnpm dev` when they are already running.

## Git hooks — husky + commitlint

- **husky** installs git hooks; the `prepare` script (`husky`) runs automatically
  after `pnpm install`.
- **commit-msg hook** (`.husky/commit-msg`) runs **commitlint** to enforce
  Conventional Commits. See [`rules/commit-rules.md`](rules/commit-rules.md).
- Do not bypass hooks with `--no-verify`.

## Helper scripts (`scripts/`)

- `node scripts/install-skills.mjs` — installs the agent skills used in this repo
  (`frontend-design`, `caveman-commit`) via `npx skills add`.
- `node scripts/generate-supabase-keys.mjs` — generates local `ANON_KEY` and
  `SUPABASE_SERVICE_ROLE_KEY` values signed with the `JWT_SECRET` from `.env`.
- `node scripts/sync-commands.mjs` — turns canonical prompts in `documentation/prompts/*.md`
  into slash-command files (`.cursor/commands`, `.claude/commands`,
  `.opencode/commands`) and generated Codex skills under `.codex/skills`, removing
  stale managed artifacts when a workflow is retired.
- `node scripts/sync-agents.mjs` — generates Codex, Claude, and OpenCode role configuration from
  `documentation/agents/*-agent.md`; Searcher and Integrated Reviewer roles are
  read-only, while Builders receive workspace-write access without subagent creation.
- `pnpm check:complexity` — checks complexity against the shared baseline. Add
  `-- --scope apps/server` (or `apps/web`, `packages/core`, or
  `packages/validation`) to check one source scope.
- `node scripts/write-coverage-report.mjs` — formats the JSON coverage summary
  for the CI job summary and pull-request comment.

## Editor configuration

`apps/web/.vscode/settings.json` and the root `.vscode/settings.json` set Biome as
the default formatter, enable `organizeImports` on save, mark `routeTree.gen.ts` as
read-only/excluded, and force TypeScript to index workspace package subpath exports
(`typescript.preferences.includePackageJsonAutoImports: "on"`).
