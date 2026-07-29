---
description: Create an HMS implementation plan from a technical specification.
---

# Prompt: Create Plan

**Goal:** decompose an HMS technical specification into phases and atomic tasks with
explicit dependencies, observable outcomes, and executable monorepo validation.

## Input

- **Spec:** `documentation/features/<module>/<feature>/specs/<name>-spec.md`.
- **Jira tickets:** one or more tickets listed in the spec frontmatter under
  `jira_tickets`.
- **Optional context:** scope limits, priority, Jira tickets, or files already changed.

Bug reports do not enter this flow directly. Derive a correction spec from the report
before creating a plan. If the spec is missing, incomplete, or contains blocking
decisions, record the open question and do not invent tasks.

## Required reading

Before planning, read `AGENTS.local.md` and the complete spec. Then consult, according
to scope:

- `documentation/modules.md` — module responsibility;
- `documentation/architecture.md` — boundaries and flows;
- `documentation/infrastructure.md` — approved stack and integrations;
- `documentation/design.md` — when UI is involved;
- `documentation/tooling.md` — scripts, pnpm filters, migrations, and generated files;
- `documentation/rules/core-package-rules.md` — when `packages/core` changes.

Read every Jira ticket associated with the spec when the integration is available. If
there are several, preserve the relationship between each ticket, its acceptance
criteria, and plan tasks. Do not merge conflicting requirements without recording an
open question.

Do not reference Studio, Hono, Next.js, RPC, or rules that do not exist in HMS. The
application transport is REST through NestJS unless explicit evidence establishes a new
approved pattern.

## Planning rules

1. Use the real workspaces: `core` (`packages/core`), `server` (`apps/server`), and
   `web` (`apps/web`). Omit workspaces that are not affected.
2. Start from the domain contract when the change has shared domain behavior. A UI-only
   or infrastructure-only change may start in its applicable phase.
3. Preserve the order: core → persistence/providers → REST controllers → web. Phases
   that are independent after a common contract may run in parallel.
4. Each task implements or changes one artifact or cohesive unit, not an entire layer.
5. Every task states dependencies, real paths or new files, an observable result, and
   workspace/layer.
6. A task that creates or changes testable behavior must be followed by an automated
   test task. Tests belong to the artifact workspace and use Vitest; server HTTP routes
   may use Supertest, and UI tests use Testing Library when infrastructure exists.
7. Every plan that changes visible or interactive Web UI must also include a Playwright
   MCP browser-validation task after implementation and automated UI tests. This is
   required even when Testing Library coverage exists.
8. Playwright MCP validation complements automated tests; it does not replace Vitest,
   Testing Library, type checks, or linting.
9. Every plan that adds or changes a Server HTTP route must also include a `curl` smoke-
   validation task against the running Server after route implementation and automated
   integration tests. This is required even when Supertest coverage exists.
10. `curl` smoke validation complements automated tests; it must verify representative
    success, validation/error, and conflict responses, including persisted effects for
    write routes when applicable.
11. Do not create isolated test tasks for migrations, mappers, configuration, or internal
   details. Cover them through the use case, controller, route, or widget that exposes
   the behavior.
12. Do not add libraries without justification and without consulting
    `documentation/infrastructure.md`.
13. If the spec changes architecture, tooling, design system, or a module boundary,
    create an explicit documentation task.

## Allowed layers

Use only these values in the **Layer** field:

- `core` — domain and contracts in `packages/core`;
- `database` — Drizzle schema, repositories, mappers, and migrations;
- `provision` — providers and external integrations;
- `rest` — NestJS controllers, DTOs/schemas, and HTTP adaptation;
- `ui` — widgets, hooks, contexts, stores, and Web components;
- `route` — TanStack Router route files;
- `test` — automated tests, curl route validation, and Playwright MCP browser validation
  associated with a task;
- `docs` — architecture, rules, design, or tooling.

## Validation per task

The plan must describe scenarios, not merely say “add tests.” Include valid and invalid
cases, transitions, authorization/ownership, UI states, and relevant errors derived from
the spec. Use the real workspace commands:

| Workspace | Lint/type checks | Automated tests |
|---|---|---|
| `packages/core` | `pnpm --filter @hms/core lint` and `pnpm --filter @hms/core check-types` | `pnpm --filter @hms/core test` |
| `apps/server` | `pnpm --filter server lint` and `pnpm --filter server check-types` | `pnpm --filter server test` or `test:e2e` |
| `apps/web` | `pnpm --filter web lint` and `pnpm --filter web check-types` | `pnpm --filter web test` |

### Required Playwright MCP validation for Web UI

For every visible or interactive Web UI change, add a dedicated task that uses the
Playwright MCP against the running application. The task must:

- depend on the UI implementation and its automated test task;
- identify the real route or consumer that exposes the changed UI;
- start or reuse the required local Web/Server services using documented commands;
- exercise the primary user flow and the critical validation/error states from the spec;
- verify keyboard interaction, focus behavior, and accessible names/state through the
  browser accessibility snapshot where relevant;
- inspect browser console errors and failed network requests;
- verify at least one narrow viewport when responsive behavior is affected;
- record the observed browser result in the plan task outcome.

Do not use a synthetic standalone HTML page as implementation validation. Test the
actual application integration point. If the UI has no runnable route or consumer, add
the missing integration task or record a blocker instead of claiming browser validation.

### Required curl validation for Server routes

For every new or changed Server HTTP route, add a dedicated task that uses `curl` against
the running application. The task must:

- depend on the route implementation and its automated integration test task;
- start or reuse the required local Server and database services using documented
  commands;
- use the real HTTP method, path, headers, and representative JSON payload;
- verify status code, response shape, and relevant error payloads;
- cover validation failures and conflict/not-found behavior required by the spec;
- verify the persisted effect of write routes through a follow-up request or approved
  repository/database observation;
- record the command and observed result in the plan task outcome without exposing
  secrets or personal data.

Do not treat a `.rest` example or a controller unit test as curl validation. If the route
cannot be exercised against a running application, record the environment blocker rather
than claiming that the route was smoke-tested.

## Output

Save the plan next to the spec:

`documentation/features/<module>/<feature>/plans/<name>-plan.md`

Preserve intermediate segments between `documentation/features/` and `specs/`, changing
only `specs` to `plans` and `-spec.md` to `-plan.md`.

Use this format:

```md
---
description: Implementation plan for the <name> HMS specification.
spec: documentation/features/<module>/<feature>/specs/<name>-spec.md
jira_tickets:
  - PROJ-123
  - PROJ-456
status: open
---

## Open questions

- [ ] <open question, impact, and required action>

## Phase dependencies

| Phase | Objective | Depends on | Parallel with |
|---|---|---|---|
| F1 | <objective> | - | - |
| F2 | <objective> | F1 | F3 |

## F1 — Core: domain and contracts

### Tasks

- [ ] **T1.1** — <implement or change an artifact under `packages/core/...`>
  - **Depends on:** -
  - **Observable result:** <verifiable behavior>
  - **Layer:** `core`

- [ ] **T1.1t** — <test the artifact>
  - **Depends on:** T1.1
  - **Observable result:** <covered scenarios>
  - **Layer:** `test`
  - **Workspace:** `@hms/core`

## F2 — Server: persistence and REST

### Tasks

- [ ] **T2.1** — <migration/repository/provider under `apps/server/...`>
  - **Depends on:** T1.1
  - **Observable result:** <verifiable result>
  - **Layer:** `database`

- [ ] **T2.2** — <REST controller under `apps/server/...`>
  - **Depends on:** T2.1
  - **Observable result:** <expected route, status, and payload>
  - **Layer:** `rest`

- [ ] **T2.2t** — <test the controller/route>
  - **Depends on:** T2.2
  - **Observable result:** <covered HTTP scenarios>
  - **Layer:** `test`
  - **Workspace:** `server`

- [ ] **T2.2v** — <validate the running route with curl>
  - **Depends on:** T2.2t
  - **Observable result:** <status codes, payloads, error cases, and persisted effect>
  - **Layer:** `test`
  - **Workspace:** `server`

## F3 — Web: route and interface

### Tasks

- [ ] **T3.1** — <route/widget/hook under `apps/web/src/...`>
  - **Depends on:** T2.2
  - **Observable result:** <verifiable states and interaction>
  - **Layer:** `ui`

- [ ] **T3.1t** — <test the route/widget with Vitest and Testing Library>
  - **Depends on:** T3.1
  - **Observable result:** <behavior and accessibility scenarios covered>
  - **Layer:** `test`
  - **Workspace:** `web`

- [ ] **T3.1v** — <validate the implemented UI with Playwright MCP>
  - **Depends on:** T3.1t
  - **Observable result:** <real browser flow, accessibility, responsive viewport,
    console, and network observations>
  - **Layer:** `test`
  - **Workspace:** `web`
```

Adapt the template to the actual scope: do not create empty phases, do not force a Core
phase when the spec does not touch domain behavior, and do not group independent tasks
only to reduce the number of IDs.
