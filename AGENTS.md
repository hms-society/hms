Guidance for AI coding agents working in this repository (HMS).

HMS is a pnpm + Turborepo monorepo:

- `apps/web` — TanStack Start + React frontend (Tailwind v4, shadcn/ui)
- `apps/server` — NestJS backend
- `packages/core` — shared domain (entities, errors, events, constants) consumed by both apps

## Required reading

Before writing or changing code, read the documents below. They are the source of
truth for how this project is meant to look, run, and be organized — do not infer
these from the code alone.

### 1. [`documentation/design.md`](documentation/design.md) — read before any UI work

The design system for `apps/web`. Defines the full token set (colors in OKLCH,
typography, spacing, radius, shadows) and the rationale behind them.

- **When to read:** any time you touch UI, styling, components, or `global.css`.
- **How to apply:** use the documented design tokens (CSS variables / Tailwind
  theme) — never hardcode colors, fonts, radii, or shadows. Headings use the serif
  family, body uses the sans family. Respect light/dark behavior. Cross-check your
  output against the documented contrast/accessibility notes.

### 2. [`documentation/infrastructure.md`](documentation/infrastructure.md) — read before adding deps or wiring tech

The approved technology stack across front-end, back-end, database, auth, testing,
and tooling, with the reason each tool was chosen.

- **When to read:** before introducing a new library, framework, or integration,
  or before deciding how a concern (state, forms, validation, data fetching, auth)
  should be implemented.
- **How to apply:** prefer the tools already listed (e.g. TanStack Query/Router,
  React Hook Form + Zod, BiomeJS, Drizzle, Supabase). Do not add a competing
  library for a concern the stack already covers. If a genuinely new tool is
  needed, flag it rather than introducing it silently.

### 3. [`documentation/modules.md`](documentation/modules.md) — read before any domain/feature work

The bounded modules of the system (Identity, Document Engine, Case Management, and others) and the
exact responsibilities each one owns.

- **When to read:** before adding or changing any business/domain logic, entities,
  use cases, or API endpoints.
- **How to apply:** place code in the module that owns the responsibility. **No
  module reaches into another's scope** — modules communicate through events and
  shared references. Mirror this boundary in both `packages/core` (domain) and the
  app layers (`apps/server`, `apps/web`).

### 4. [`documentation/tooling.md`](documentation/tooling.md) — read before running commands or changing config

The developer tooling: package manager (pnpm), monorepo orchestration (Turborepo),
linting/formatting (BiomeJS), testing (Vitest), database (drizzle-kit), git hooks,
and helper scripts.

- **When to read:** before running build/test/lint commands, adding scripts, or
  changing any tooling/config (`turbo.json`, `biome.json`, `tsconfig`, hooks).
- **How to apply:** use the documented commands and `--filter` workspace targets;
  respect Biome formatting (don't introduce a different formatter); don't bypass
  git hooks.

## Other conventions

- **Commits:** follow [`documentation/rules/commit-rules.md`](documentation/rules/commit-rules.md)
  (Conventional Commits, enforced by commitlint + husky).
- **Pull requests:** follow [`documentation/prompts/create-pr-prompt.md`](documentation/prompts/create-pr-prompt.md).

## Workflow expectations

- Read the relevant document(s) above **before** starting, not after.
- When a change spans UI + a new dependency + domain logic, read all of the
  applicable documents.
- If code and documentation disagree, treat the documentation as intent and surface
  the discrepancy instead of silently following the code.
- When creating a git worktree or branch checkout from this repository, copy only
  ignored or otherwise untracked local env files (for example `.env`,
  `.env.development`, `.env.testing`, `.env.production`). Do **not** copy tracked
  template files such as `.env.example` into the new worktree, even if using a
  broad pattern like `.env*`. Prefer `git ls-files --others --ignored
  --exclude-standard -- '.env*'` or an equivalent approach that excludes tracked
  files.
