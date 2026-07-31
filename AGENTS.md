Guidance for AI coding agents working in this repository (HMS).

HMS is a pnpm + Turborepo monorepo:

- `apps/web` — TanStack Start + React frontend (Tailwind v4, shadcn/ui)
- `apps/server` — NestJS backend
- `packages/core` — shared domain (entities, errors, events, constants) consumed by both apps

## MCP availability and usage

The development environment provides the following MCP servers. Use them when
the task matches their purpose; do not invoke them for repository work that can
be completed reliably from the local source and tooling alone.

### Playwright (`mcp__playwright__*`)

Use Playwright to validate browser behavior in `apps/web`, especially after UI,
route, authentication, form, or REST integration changes. It can navigate the
running application, inspect the accessibility snapshot, interact with fields
and controls, capture console messages, and inspect network requests and
responses. Prefer snapshots, console output, and network inspection for
diagnosis; use screenshots when visual confirmation is needed. Start the web
application and any required backend services before using it.

#### Required authenticated-browser workflow

For an authenticated flow, do not treat a successful navigation or a mocked
transport as sufficient evidence. Use this sequence:

1. Confirm the local dependencies before opening the browser:
   `docker compose ps -a`, `curl http://localhost:8000/auth/v1/health`, and
   `curl http://localhost:3333/health`. The database and Auth containers must be
   healthy, and the server must finish Nest bootstrap without
   `UnknownDependenciesException`.
2. Start `pnpm --filter server dev` and `pnpm --filter web dev` in persistent
   terminal sessions. Record the sessions so they can be stopped with Ctrl-C
   after validation. Do not begin browser assertions while either process is
   still compiling or restarting.
3. Resolve the seed credentials from
   `apps/server/src/identity/database/identity-seeder.ts` and the local env.
   For the current seed, the administrator is
   `admin@hmsadvogados.com.br`; never assume a credential without checking the
   source and `HMS_USER_SEED_PASSWORD` first.
4. Navigate to `/login`, capture a fresh accessibility snapshot, fill the
   visible email and password fields, submit, and wait for the authenticated
   destination. Verify both the URL and authenticated content before testing a
   protected route.
5. Navigate to the protected route and validate real server-backed behavior.
   For Identity, verify `/colaboradores`, filters/search URL state, row actions,
   details, and the relevant form/dialog. Use the real REST/Auth services for
   this pass; `page.route` mocks belong only to isolated route/widget tests and
   must be labeled as such in the evidence.
6. After each navigation or state-changing interaction, take a new
   `browser_snapshot`. Accessibility refs are ephemeral: never reuse a ref from
   an older snapshot after navigation or re-render. Prefer role/name or the
   current snapshot ref over CSS selectors.
7. Inspect `browser_console_messages` at the end of each flow and inspect
   `browser_network_requests` for failed API calls. Any console error, 4xx/5xx
   response, hydration warning, or auth refresh failure must be recorded and
   classified as fixed, pre-existing, or blocking; do not call a flow green
   solely because the test reached the expected URL.
8. Exercise at least one narrow viewport and keyboard path for UI changes. If
   the Contract includes responsive, theme, focus, or accessibility behavior,
   validate each explicitly rather than inferring it from a desktop snapshot.

Common recovery checks:

- If Auth returns `ECONNREFUSED` or the hostname `supabase-db` is unresolved,
  inspect `docker compose ps -a` and `docker logs supabase-db`; recreate the
  affected container only after confirming bind-mount paths are files, not
  directories, then wait for health before restarting Auth.
- If Nest reports an unknown dependency during bootstrap, fix module imports or
  exports before using Playwright. REST fixtures may override guards and can
  hide application-composition errors.
- If `/auth/v1/token?grant_type=refresh_token` returns 400, start a fresh browser
  context/session or sign in again before diagnosing the feature; stale tokens
  must not be reported as a feature failure.
- If the browser process is left running, stop the recorded Web/Server sessions
  after the run and leave shared Docker services unchanged unless the task
  explicitly requests teardown.

### Context7 (`mcp__context7__*`)

Use Context7 when implementation depends on current documentation for a library,
framework, SDK, API, CLI, or cloud service. Resolve the library identifier with
`mcp__context7__resolve_library_id` and then query the relevant documentation
with `mcp__context7__query_docs`. Prefer Context7 over relying on memory or
outdated examples, and do not use it as a substitute for reading repository
source or local project rules.

### Pencil (`mcp__pencil__*`)

Use Pencil for `.pen` files, Pencil node inspection or editing, design-system
work, and design-to-code or visual validation tasks tied to Pencil designs.
Before any other Pencil operation, call
`mcp__pencil__get_editor_state` with `include_schema: true` when the current
editor schema is not already known. `.pen` files are encrypted: never read or
search them with shell commands, `Read`, or `Grep`; use only the Pencil MCP
tools. Use the Pencil design skill when the task involves Pencil workflows.

## Required reading

Before writing or changing code, read the documents below. They are the source of
truth for how this project is meant to look, run, and be organized — do not infer
these from the code alone.

### 0. [`AGENTS.local.md`](AGENTS.local.md) — read before any task

This file contains repository-local instructions that may vary by workspace or
execution context.

- **When to read:** always, before running commands or reading, writing, or
  changing any project file.
- **How to apply:** treat its instructions as mandatory alongside this file and
  resolve them before starting the task. If the file does not exist or is empty,
  continue with the instructions below.

### 1. [`documentation/rules/rules.md`](documentation/rules/rules.md) — read before selecting task rules

This file is the router for repository-specific implementation and testing rules.
It applies the **dynamic context discovery** pattern so agents load rules according
to both the paths touched and the architectural behavior affected.

- **When to read:** always, immediately after `AGENTS.local.md` and before reading
  or changing task files.
- **How to apply:** identify the likely scope, use its routing table to select all
  applicable rule documents, read those documents in full, and repeat discovery
  whenever the task expands into another layer. Do not load every rule by default
  and do not rely only on keywords from the request.

### 2. [`documentation/design.md`](documentation/design.md) — read before any UI work

The design system for `apps/web`. Defines the full token set (colors in OKLCH,
typography, spacing, radius, shadows) and the rationale behind them.

- **When to read:** any time you touch UI, styling, components, or `global.css`.
- **How to apply:** use the documented design tokens (CSS variables / Tailwind
  theme) — never hardcode colors, fonts, radii, or shadows. Headings use the serif
  family, body uses the sans family. Respect light/dark behavior. Cross-check your
  output against the documented contrast/accessibility notes.

### 3. [`documentation/infrastructure.md`](documentation/infrastructure.md) — read before adding deps or wiring tech

The approved technology stack across front-end, back-end, database, auth, testing,
and tooling, with the reason each tool was chosen.

- **When to read:** before introducing a new library, framework, or integration,
  or before deciding how a concern (state, forms, validation, data fetching, auth)
  should be implemented.
- **How to apply:** prefer the tools already listed (e.g. TanStack Query/Router,
  React Hook Form + Zod, BiomeJS, Drizzle, Supabase). Do not add a competing
  library for a concern the stack already covers. If a genuinely new tool is
  needed, flag it rather than introducing it silently.

### 4. [`documentation/modules.md`](documentation/modules.md) — read before any domain/feature work

The bounded modules of the system (Identity, Document Engine, Case Management, and others) and the
exact responsibilities each one owns.

- **When to read:** before adding or changing any business/domain logic, entities,
  use cases, or API endpoints.
- **How to apply:** place code in the module that owns the responsibility. **No
  module reaches into another's scope** — modules communicate through events and
  shared references. Mirror this boundary in both `packages/core` (domain) and the
  app layers (`apps/server`, `apps/web`).

### 5. [`documentation/tooling.md`](documentation/tooling.md) — read before running commands or changing config

The developer tooling: package manager (pnpm), monorepo orchestration (Turborepo),
linting/formatting (BiomeJS), testing (Vitest), database (drizzle-kit), git hooks,
and helper scripts.

- **When to read:** before running build/test/lint commands, adding scripts, or
  changing any tooling/config (`turbo.json`, `biome.json`, `tsconfig`, hooks).
- **How to apply:** use the documented commands and `--filter` workspace targets;
  respect Biome formatting (don't introduce a different formatter); don't bypass
  git hooks.

## Workflow expectations

- Always read `AGENTS.local.md` and the rules router first. Read the dynamically
  selected rule documents and the relevant documents above **before** starting,
  not after.
- Re-run dynamic context discovery when implementation reaches files or behavior
  outside the initial scope.
- When a change spans UI + a new dependency + domain logic, read all of the
  applicable documents.
- If code and documentation disagree, treat the documentation as intent and surface
  the discrepancy instead of silently following the code.
- Whenever implementation work reveals or introduces a business-rule change,
  update the corresponding PRD before concluding the task, and keep the code,
  design, and repository documentation aligned with that decision.
- When dynamic context discovery identifies a recurring path, layer, or behavior
  that is not mapped by `documentation/rules/rules.md`, ask the user whether the
  convention should be codified as a rule under `documentation/rules/` before
  silently treating it as repository policy. If the gap is specific to a single
  change, do not block implementation unnecessarily; report the unmapped scope
  and the user's decision in the final summary.
- When creating a git worktree or branch checkout from this repository, copy only
  ignored or otherwise untracked local env files (for example `.env`,
  `.env.development`, `.env.testing`, `.env.production`). Do **not** copy tracked
  template files such as `.env.example` into the new worktree, even if using a
  broad pattern like `.env*`. Prefer `git ls-files --others --ignored
  --exclude-standard -- '.env*'` or an equivalent approach that excludes tracked
  files.
