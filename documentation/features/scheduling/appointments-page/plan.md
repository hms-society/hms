---
title: Agenda de Consultas — implementation plan
status: completed
spec: ./spec.md
spec_revision: 13
evaluation: ./evaluation.md
jira_tickets:
  - SCRUM-146
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2686977/PRD+M+dulo+de+Agendamento
updated_at: 2026-09-29
---

# Execution status

- **Spec:** [spec.md](spec.md), revision 13, `completed`.
- **Rationale:** Plan-backed execution is required by the Core/Validation/Server/Web ownership boundaries, transactional database and outbox integration, migration risk, and multi-viewport authenticated validation.
- **Current phase:** F7 — Integrated validation and publication handoff, completed after the final PR-head CI gate.
- **Next action:** Review the three ready-for-review PRs in dependency order; no implementation or evidence task remains.
- **Active blockers:** none. FND-038 and FND-039 are resolved. Remaining manual role/concurrency/broker-failure scenarios, visual parity differences, and the inherited Drizzle snapshot-parent collision are explicitly classified in Evaluation as partial/non-blocking. Prior revision 11/12 screenshots remain historical for changed rescheduling behavior; current revision 13 captures and comparisons are in Evaluation. Preserve all unrelated user work outside the feature delivery.
- **Builders:** Core, Validation and Server ownership Builders are complete. `builder_web` completed the FND-038 locator correction; the existing `reviewer` rechecked it and FND-036. Clean-candidate coverage passes for all four workspaces (Core 124/404, Validation 6/18, Server 87/201, Web 122/406 with 3 skips); focused Agenda and Intake route checks pass locally. Current-source Admin/Lawyer block checks, cross-lawyer transfer and 11 supplemental state/recovery captures are recorded in Evaluation.
- **Shared coordination:** `builder_core` owns Core contracts/use cases; `builder_validation` owns shared schemas; `builder_server` owns server persistence/REST/messaging and migration artifacts; `builder_web` owns web REST consumers, route, widgets and browser tests. The Orchestrator owns integration, generated route metadata, lockfile/root configuration, evaluation, and final evidence.

# Execution ledger

| Wave | Builder | Phase | Task | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `builder_core` | F1 | Core contracts and domain model | — | F2 | `completed` | Core structures, entities, errors, events, providers and repository contracts compile and are exported without application dependencies. |
| 1 | `builder_validation` | F2 | Shared validation boundary | — | F1 | `completed` | Scheduling/Consultation schemas, barrels, package exports and schema tests pass the Validation checks. |
| 2 | `builder_core` | F3 | Core use cases and unit coverage | F1 | F4 | `completed` | Calendar, filter, availability, detail, action, access and Consultation guard use cases pass deterministic unit coverage. |
| 2 | `builder_server` | F4 | F4-T1 — PostgreSQL models and migration | F1 | F3 | `completed` | Models, mappers, schema, migration and compatibility artifacts implement the persisted contract without changing transaction orchestration. |
| 2 | `builder_server` | F4 | F4-T2 — Repositories and transaction executor | F1, F4-T1 | F3, F4-T3 | `completed` | Scheduling/Consultation repositories and the shared transactional executor implement Core contracts with locking, retry and rollback behavior. |
| 2 | `builder_server` | F4 | F4-T3 — Cross-module projection providers | F1, F4-T1 | F3, F4-T2 | `completed` | Identity and Consultation projections are available through narrow provider tokens and preserve module boundaries. |
| 3 | `builder_server` | F5 | F5-T1 — Calendar REST and appointment actions | F2, F3, F4-T2 | F6 | `completed` | Calendar/detail/filter/slot/action endpoints and real controller tests map HTTP behavior to Core use cases. |
| 3 | `builder_server` | F5 | F5-T2 — Consultation REST and module composition | F2, F3, F4-T2, F4-T3, F5-T1 | F6 | `completed` | Consultation guards/transitions, root module wiring, legacy route protection and application composition pass integration checks. |
| 3 | `builder_server` | F5 | F5-T3 — Messaging, outbox and REST examples | F4-T2, F5-T2 | F6 | `completed` | Inngest jobs, stable event handling, retry/deduplication behavior and complete `.rest` examples are verified. |
| 3 | `builder_web` | F6 | F6-T1 — Route, services and state hooks | F2, F3 | F5 | `completed` | The route contract, URL state, typed REST services and owning query/action hooks are implemented. |
| 3 | `builder_web` | F6 | F6-T2 — Calendar surfaces and feedback states | F6-T1 | F5, F6-T3 | `completed` | Weekly/monthly/mobile calendar surfaces, appointment cards, toolbar/filter entry points and loading/empty/error/restricted states match the Spec. |
| 3 | `builder_web` | F6 | F6-T3 — Appointment dialogs and action flows | F6-T1 | F5, F6-T2 | `completed` | Details, client filter, cancel, reschedule and overflow dialogs implement focus, validation, permission and recovery behavior. |
| 3 | `builder_web` | F6 | F6-T4 — Web tests and generated route | F6-T2, F6-T3 | F5 | `completed` | Intake option-role correction passes the focused 8/8 local route suite and final PR #183 Web CI; Agenda route and full Web coverage pass on the final slice. Other Web suite, keyboard, focus and narrow viewport evidence is recorded. |
| 4 | `reviewer` | R1 | Integrated read-only review | F5-T3, F6-T4 | F7 | `completed` | Same Reviewer rechecked both the overflow-trigger correction and FND-038 on the current candidate; the locator matches the accessible option semantics, assertions remain intact, and no Rule gap was found. Residual gaps are validation coverage only. |
| 4 | `orchestrator` | F7 | Integrated validation and publication handoff | F5-T3, F6-T4, R1 | — | `completed` | Exact clean-candidate workspace coverage, typechecks, lint/architecture and focused Playwright evidence pass. Evaluation is `completed`; PR delivery uses three dependency slices: Core/Validation (#180), Server (#181), and a combined lawyer selector + Agenda Web slice (#183) based on #181. The standalone selector PR #182 was superseded because its isolated Web CI head could not pass the established coverage floor on the unchanged develop Web sources; the combined Web slice passes that coverage gate and stays under the 5,000-line limit. Final PR-head CI Quality Gate passed for #180 SHA `e0825e01`, #181 SHA `ede3c3c7`, and #183 SHA `5fe053f1` (including Hermes review and size gates). Remaining MV/VIS partial classifications and the upstream Drizzle metadata collision are explicit and non-blocking for runtime migration application. |
| 5 | `builder_core` + `builder_validation` | F8 | F8-T1 — Core lawyer-transfer contract and shared schemas | F1/F2/F3 | — | `completed` | Optional lawyerId is validated; slots carry the destination agenda's IANA timezone for correct presentation. Core typecheck passed. |
| 5 | `builder_server` | F8 | F8-T2 — Cross-agenda transaction, persistence and Consultation adapter | F8-T1 | F8-T3 | `completed` | Origin/destination schedules lock in stable order; appointment, pending Consultation lawyer, change history and event commit atomically; slots expose destination timezone; active lawyer is revalidated under an Identity row lock. Server typecheck passed. |
| 5 | `builder_web` | F8 | F8-T3 — yVAoI dialog and typed lawyer/slot flow | F8-T1 | F8-T2 | `completed` | Dialog offers active lawyers, refreshes slots on lawyer/date changes, shows current/new summary in the destination timezone, and reloads details/slots after conflicts while preserving available selections. Web typecheck and Biome pass. |
| 6 | `orchestrator` + `reviewer` | F8 | F8-T4 — Integrated contract review and evidence refresh | F8-T1–T3 | — | `completed` | Independent review corrections are integrated; authenticated transfer and revision 13 Admin/Lawyer evidence plus current responsive dialog screenshots are in Evaluation. Supplemental state captures and final coverage were completed after this row began. |
| 7 | `builder_web` + orchestrator | F9 | F9-T1 — Hide block cards from Admin calendar projection | F8 | — | `completed` | Admin and unresolved-role page projections suppress cached blocks; Server projection omits Admin blocks and toolbar filter; known non-Admin behavior and Lawyer availability constraints remain. EV-071 records current-source Admin/Lawyer REST and browser checks. |

## Publication slices

The reviewed TypeScript addition count uses the repository size-gate rule: added `.ts`, `.tsx`, `.mts` and `.cts` lines in each PR diff against its declared base. Each slice has a concrete ownership or dependency boundary.

| Order | Proposed branch | Scope | TypeScript additions | Base / dependency | Criteria and outcome |
| --- | --- | --- | ---: | --- | --- |
| 1 | `codex/agenda-core-validation` | Core contracts/use cases, shared schemas, migration-independent Spec/Plan/Evaluation/design bundle, timestamp precision Rule clarification, minimal Validation lockfile entry, required app path aliases and the Web/Server coverage floors rebased to current develop coverage | 3,775 | `develop`; independent foundation | `RF-01`–`RF-08`; `CA-01`–`CA-09`; domain/persistence contracts. |
| 2 | `codex/agenda-server` | Server modules, REST/controllers, repositories, consultation synchronization/outbox, migration 0053–0055, fixtures and REST examples | 3,743 | Base on PR 1 | `CA-02`–`CA-07`, `CA-09`; real persistence and access boundaries. |
| 3 | `codex/agenda-web` | Shared Identity lawyer selector and Intake integration, `/agenda/consultas`, typed REST consumers, calendar/dialog widgets and tests, generated route metadata; removes only blank placeholder consultation pages/routes | 4,956 | Base on PR 2 | `RF-01`–`RF-08`; `CA-01`–`CA-09`; reusable selection and UI route delivery. |

Every slice remains under the 5,000-line limit. The three delivery PRs are open for review in dependency order; PR #182 is closed as superseded by the combined Web slice. Keep inherited test-integrity tooling, unrelated Identity/Intake test edits, the generated local Playwright snapshot and other dirty user files outside the branches.

### F1 — Core contracts and domain model

#### F1-T1 — Establish calendar, history, transaction and consultation event contracts

- **Status/owner:** `completed` — `builder_core`
- **Depends/parallel:** No dependency; parallel with F2. F3 and F4 consume these contracts.
- **Paths:** `packages/core/src/scheduling/domain/{structures/{calendar-query,calendar-appointment,calendar-block,calendar-event,appointment-change-display,appointment-details,index}.ts,entities/{appointment-change,index}.ts,errors/{appointment-action-forbidden-error,appointment-not-editable-error,appointment-revision-conflict-error,index}.ts,events/{appointment-cancelled-event,appointment-rescheduled-event}.ts}`; `packages/core/src/consultation/domain/{entities/{consultation-outbox-event,index}.ts,errors/{consultation-appointment-cancelled-error,index}.ts}`; `packages/core/src/shared/interfaces/{calendar-identity-provider,calendar-consultation-provider,appointment-write-transaction-provider}.ts`; scheduling/consultation repository interfaces and their barrels.
- **Contract:** RF-01–RF-07; CA-01–CA-07; Technical Contract §3 Core Domain and Interfaces.
- **Outcome:** Core exposes the separate calendar projections, immutable change/outbox entities, named errors/events, narrow cross-module `Provider` contracts, and transaction scopes required by the later adapters; no Drizzle, Nest, validation, or application imports cross into Core.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/messaging-layer-rules.md`; relevant `Core Package Rules — Antipatterns to Avoid: Adding readonly to every Structure field`.
- **Exit:** `pnpm --filter @hms/core check-types`, `pnpm --filter @hms/core lint`, barrel/export inspection, and a contract review against the Spec’s exact declarations and provider naming.

### F2 — Shared validation boundary

#### F2-T1 — Add calendar, action, route-search and outbox schemas

- **Status/owner:** `completed` — `builder_validation`
- **Depends/parallel:** No dependency; parallel with F1. Server and Web consume the public package exports.
- **Paths:** `packages/validation/src/scheduling/schemas/**`; `packages/validation/src/scheduling/index.ts`; `packages/validation/src/consultation/schemas/consultation-outbox-event-schema.ts`; `packages/validation/src/consultation/index.ts`; `packages/validation/package.json`; colocated schema tests.
- **Contract:** RF-01, RF-05–RF-07; CA-01, CA-04–CA-07, CA-09; Validation Contract schema matrix.
- **Outcome:** Shared Zod schemas validate civil dates, UUIDs, query/search defaults, action revisions, slot/filter options and ISO event envelopes without encoding authorization, persistence, or workflow decisions.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/validation-package-rules.md`; use canonical Core enum-like values where available.
- **Exit:** `pnpm --filter @hms/validation lint`, `pnpm --filter @hms/validation check-types`, `pnpm --filter @hms/validation test`, and assertions for valid/defaulted input plus every malformed/default/boundary branch in the Spec.

### F3 — Core use cases and unit coverage

#### F3-T1 — Implement calendar reads, availability, actions and Consultation guards

- **Status/owner:** `completed` — `builder_core`
- **Depends/parallel:** Depends on F1; may run while F4 builds adapters. F5 consumes the completed use-case signatures.
- **Paths:** `packages/core/src/scheduling/domain/use-cases/**` and their tests; existing reservation use case/test; `packages/core/src/consultation/use-cases/{complete-consultation-use-case,finalize-consultation-attendance-use-case,create-consultation-from-appointment-use-case,get-consultation-use-case,get-consultation-by-intake-use-case}.ts`; corresponding Consultation tests; colocated Core fakers/barrels required by the tests.
- **Contract:** RF-01–RF-07; CA-01–CA-07; Technical Contract §3 Use cases, including actor-first access, multi-time-zone civil periods, canonical availability, idempotent revisions, shared locks and 404-safe Consultation access.
- **Outcome:** Use cases enforce business policy in Core, reuse `DatetimeProvider`, apply authorization before sensitive reads, preserve appointment identity, and queue Consultation outbox records only through the transactional repository contract.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/use-case-testing-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/messaging-layer-rules.md`; relevant `Core Package Rules — Antipatterns to Avoid: Adding readonly to every Structure field`; use-case tests stay infrastructure-free and use typed mocks/fakers.
- **Exit:** `pnpm --filter @hms/core test`, `pnpm --filter @hms/core check-types`, `pnpm --filter @hms/core lint`; unit evidence covers roles, forged IDs, date/fuso/DST edges, filters/cursors, availability, idempotency, stale revisions, cancellation guards, transaction callbacks and no broker call inside a transaction.

### F4 — Persistence and transaction adapters

#### F4-T1 — Implement PostgreSQL models, schema and migration

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F1; parallel with F3. F4-T2 and F4-T3 consume the persisted schema; F5 waits for this task’s migration review.
- **Paths:** `apps/server/src/scheduling/database/drizzle/{models/**,types/**,mappers/**}`; `apps/server/src/consultation/database/drizzle/{models/**,types/**,mappers/**}`; `apps/server/src/shared/database/drizzle/schema/scheduling.ts`; generated migration `0053_appointment_calendar_history.sql`, snapshot and journal; schema compatibility/backfill artifacts.
- **Contract:** RF-03, RF-05–RF-07; CA-02, CA-04–CA-07, CA-09; Technical Contract §3 Database and migration model.
- **Outcome:** PostgreSQL models, mappers and schema support bounded calendar queries, persisted agenda time zones, revision uniqueness, history and Consultation outbox durability while preserving existing data.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/server-app-layer-rules.md`; preserve mapper boundaries and the no-cross-module-table-import rule.
- **Exit:** `pnpm --filter server check:types`, `pnpm --filter server check:lint`; generate and review the migration with `pnpm --filter server db:migration:generate`; verify SQL/journal, legacy backfill/defaults, indexes, constraints and rollback compatibility.

#### F4-T2 — Implement repositories and the shared transaction executor

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F1 and F4-T1; parallel with F3 and F4-T3. F5-T1/T2/T3 consume these adapters.
- **Paths:** `apps/server/src/scheduling/database/drizzle/repositories/**`; `apps/server/src/consultation/database/drizzle/repositories/**`; `apps/server/src/shared/database/drizzle/{database.module.ts,database-transaction-context.ts}`; `apps/server/src/scheduling/{constants/scheduling-repositories.ts,database/scheduling-database.module.ts}`; inherited scheduling transaction files are audited in place.
- **Contract:** RF-03, RF-05–RF-07; CA-02, CA-04–CA-07, CA-09; Technical Contract §3 Database and transaction model.
- **Outcome:** Scheduling/Consultation repositories implement Core contracts and cancel/reschedule/reserve transitions share PostgreSQL `SERIALIZABLE` execution with agenda-then-appointment locks, one retry for `40001`/`40P01`, rollback and transactional outbox writes.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/server-app-layer-rules.md`; `documentation/rules/messaging-layer-rules.md`; preserve repository tokens and never publish from inside a transaction.
- **Exit:** `pnpm --filter server check:types`, `pnpm --filter server check:lint`; adapter contract review verifies locking order, retry bounds, rollback, revision conflicts, history writes and no direct repository tests.

#### F4-T3 — Implement cross-module identity and Consultation projection providers

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F1 and F4-T1; parallel with F3 and F4-T2. F5-T2 consumes the provider tokens.
- **Paths:** `apps/server/src/identity/{constants/identity-repositories.ts,database/drizzle/repositories/drizzle-calendar-identity-provider.ts,database/identity-database.module.ts}`; `apps/server/src/consultation/constants/consultation-repositories.ts`; the Consultation projection adapter files that implement the Core provider contract.
- **Contract:** RF-02, RF-04, RF-08; CA-04, CA-08; Technical Contract §3 cross-module Provider boundaries.
- **Outcome:** Calendar identity and Consultation projections are resolved through narrow provider interfaces, expose only the fields required by scheduling, and keep Identity/Consultation table ownership inside their modules.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/server-app-layer-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/modules.md`; no scheduling module imports another module’s tables or private repositories.
- **Exit:** `pnpm --filter server check:types`, `pnpm --filter server check:lint`; module wiring and provider contract review confirm actor scope, Consultation lookup semantics and no circular ownership.

### F5 — REST, composition and messaging integration

#### F5-T1 — Expose secured calendar reads and appointment actions

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F2, F3, F4-T2 and F4-T3; parallel with F6 after the HTTP contract is stable. F5-T2 consumes the established module/controller conventions.
- **Paths:** `apps/server/src/scheduling/rest/controllers/{list-calendar.controller.ts,get-appointment-details.controller.ts,list-calendar-filter-options.controller.ts,list-reschedule-slots.controller.ts,cancel-appointment.controller.ts,reschedule-appointment.controller.ts,schedules.controller.ts,index.ts,tests/{calendar-read.controller.test.ts,appointment-actions.controller.test.ts,schedules-access.controller.test.ts}}`; `apps/server/src/scheduling/rest/dtos/calendar-response.dto.ts`.
- **Contract:** RF-02–RF-07; CA-02–CA-09; HTTP and Messaging Contracts, including actor extraction, 400/401/403/404/409/422/503 mapping, no PII leakage, legacy schedule access and stable event IDs.
- **Outcome:** Real scheduling REST endpoints implement one controller per use case, preserve `/agenda` configuration, enforce actor-first access and map domain errors to the specified HTTP responses without PII leakage.
- **Rules:** `documentation/rules/rest-layer-rules.md`; `documentation/rules/controllers-testing-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/server-app-layer-rules.md`; `documentation/rules/messaging-layer-rules.md`; `documentation/rules/code-conventions-rules.md`; controller tests must use real module wiring/PostgreSQL and `.rest` examples must cover every route.
- **Exit:** `pnpm --filter server test`, `pnpm --filter server check:types`, `pnpm --filter server check:lint`; real HTTP/persistence evidence covers scope, filters, details, slots, cancel/reschedule, stale revisions, 409/422/503 mapping and legacy schedule authorization.

#### F5-T2 — Expose Consultation REST and compose the application modules

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F2, F3, F4-T2, F4-T3 and F5-T1; parallel with F6. F5-T3 consumes the final module tokens and use-case registrations.
- **Paths:** `apps/server/src/consultation/rest/controllers/{complete-consultation.controller.ts,finalize-consultation-attendance.controller.ts,get-consultation.controller.ts,get-consultation-by-intake.controller.ts,tests/{get-consultation.controller.test.ts,get-consultation-by-intake.controller.test.ts,consultation-appointment-guard.controller.test.ts}}`; `apps/server/src/{scheduling/scheduling.module.ts,consultation/consultation.module.ts,identity/identity.module.ts,app.module.ts}`; removal of `apps/server/src/scheduling/database/drizzle/repositories/{scheduling.module.ts,rest/controllers/index.ts}`.
- **Contract:** RF-02, RF-04, RF-08; CA-04, CA-08–CA-09; HTTP Contract and module composition requirements.
- **Outcome:** Consultation GET-by-ID/Intake and transition endpoints enforce appointment-linked access, return 404-safe results, and the application composes one Scheduling root module with the correct provider ownership and legacy route protection.
- **Rules:** `documentation/rules/rest-layer-rules.md`; `documentation/rules/controllers-testing-rules.md`; `documentation/rules/server-app-layer-rules.md`; `documentation/rules/database-layer-rules.md`; controller tests use real module wiring and PostgreSQL.
- **Exit:** `pnpm --filter server test`, `pnpm --filter server check:types`, `pnpm --filter server check:lint`; integration evidence covers direct-ID/Intake authorization, transition guards, module bootstrap and legacy route access.

#### F5-T3 — Register messaging jobs, outbox handling and REST examples

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F4-T2 and F5-T2; parallel with F6. R1/F7 consume the durable-facts evidence.
- **Paths:** Scheduling/Consultation Inngest jobs, registries/modules and job tests; `apps/server/rest-client/scheduling/scheduling.rest`; messaging registration files and outbox handlers.
- **Contract:** RF-05–RF-07; CA-05–CA-07, CA-09; Messaging Contract, including stable event IDs, post-commit publication, retry and deduplication.
- **Outcome:** Appointment and Consultation facts are published only after commit, handlers retry transient failures, stable IDs prevent duplicate effects, and the `.rest` collection documents every scheduling and Consultation route.
- **Rules:** `documentation/rules/messaging-layer-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/server-app-layer-rules.md`; `documentation/rules/code-conventions-rules.md`; never call the broker from inside a transaction.
- **Exit:** `pnpm --filter server test`, `pnpm --filter server check:types`, `pnpm --filter server check:lint`; job tests and integration evidence cover rollback/no-publish, retry, deduplication, registration and complete route examples.

### F6 — Web route, service and appointments UI

#### F6-T1 — Build the route, REST consumers and state hooks

- **Status/owner:** `completed` — `builder_web`
- **Depends/parallel:** Depends on F2 and F3; parallel with F5 implementation. F6-T2/T3 consume the typed state and service boundaries; live REST/Auth validation waits for F5 and is owned by F7.
- **Paths:** `apps/web/src/routes/agenda/consultas.tsx`; `apps/web/src/rest/services/scheduling-service.ts`; `apps/web/src/constants/{routes.ts,sidebar-items.ts}`; owning query/action hooks and route-level state modules.
- **Contract:** RF-01–RF-04, RF-08; CA-01–CA-04, CA-08–CA-09; Design Contract and all six supplied references plus the three accepted supplemental state groups.
- **Outcome:** `/agenda/consultas` preserves URL view/date/filter state and exposes typed calendar/detail/filter/slot/action services with behavior kept in the owning hooks.
- **Rules:** `documentation/rules/ui-layer-rules.md`; `documentation/rules/web-app-routing-rules.md`; `documentation/rules/widget-testing-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/validation-package-rules.md`; `documentation/rules/code-conventions-rules.md`; `documentation/design.md`; `documentation/features/scheduling/appointments-page/design/manifest.md`. Relevant widget rule: separate every behavior-owning widget test from its owning-hook test; do not add dedicated query/action-hook tests beyond the Spec’s owning boundaries.
- **Exit:** `pnpm --filter web check:lint`; `pnpm --filter web check:types`; service/schema contract tests and route-state tests pass; hook ownership review confirms no transport or authorization logic is embedded in presentational widgets.

#### F6-T2 — Build calendar surfaces and feedback states

- **Status/owner:** `completed` — `builder_web`
- **Depends/parallel:** Depends on F6-T1; parallel with F5 and F6-T3 once shared UI types are stable.
- **Paths:** Calendar shell, toolbar, weekly/monthly views, mobile day-list, appointment/block cards, overflow entry points and loading/empty/filtered-empty/error/restricted state widgets under the Spec appointments-page widget tree.
- **Contract:** RF-01–RF-03, RF-08; CA-01–CA-03, CA-08–CA-09; Design Contract and weekly/monthly/mobile/state references.
- **Outcome:** Calendar views match the supplied design language, preserve URL-driven view/date/filter state, communicate loading and failure states explicitly, and remain usable at 390 × 844 without horizontal overflow.
- **Rules:** `documentation/rules/ui-layer-rules.md`; `documentation/rules/widget-testing-rules.md`; `documentation/design.md`; `documentation/features/scheduling/appointments-page/design/manifest.md`; use repository tokens and separate behavior-owning widget tests from hook tests.
- **Exit:** Widget tests cover weekly/monthly/mobile rendering, overflow, loading, empty, error and restricted states; keyboard and narrow viewport checks pass; no hardcoded design tokens are introduced.

#### F6-T3 — Build appointment dialogs and action flows

- **Status/owner:** `completed` — `builder_web`
- **Depends/parallel:** Depends on F6-T1; parallel with F5 and F6-T2 once shared UI types are stable.
- **Paths:** Appointment details, client filter, cancel confirmation, reschedule, overflow/action menu, dialog focus/recovery and form-feedback widgets under the Spec appointments-page widget tree.
- **Contract:** RF-03–RF-04, RF-08; CA-03–CA-08; Design Contract and details/filter/reschedule/cancel references plus responsive dialog supplements.
- **Outcome:** Dialogs enforce role-aware action visibility, display server validation/conflict errors, preserve appointment identity/revision state, and support focus entry, keyboard recovery and narrow layouts.
- **Rules:** `documentation/rules/ui-layer-rules.md`; `documentation/rules/widget-testing-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/design.md`; tests must keep widget behavior separate from owning hooks and use typed service boundaries.
- **Exit:** Dialog/widget tests cover focus, submit/cancel, 409/422/503 feedback, permission restrictions, responsive layout and recovery after failed actions; visual reference states are locally comparable.

#### F6-T4 — Complete web tests and generated route metadata

- **Status/owner:** `completed` — `builder_web`
- **Depends/parallel:** Depends on F6-T2 and F6-T3; parallel with F5. F7 owns real-service/authenticated browser evidence.
- **Paths:** Colocated widget/hook tests; `apps/web/tests/routes/agenda/consultas.test.ts`; generated `apps/web/src/routeTree.gen.ts` only through route generation; feature test fixtures and mocked HTTP contract setup.
- **Contract:** RF-01–RF-04, RF-08; CA-01–CA-04, CA-08–CA-09; Spec widget tree, route contract and widget-testing boundary.
- **Outcome:** Web tests exercise the complete route/widget tree with mocked transport clearly scoped to isolated coverage, generated route metadata is current, and keyboard/narrow viewport behavior is executable.
- **Rules:** `documentation/rules/ui-layer-rules.md`; `documentation/rules/web-app-routing-rules.md`; `documentation/rules/widget-testing-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/tooling.md`; use repository Playwright CLI, not Playwright MCP.
- **Exit:** `pnpm --filter web generate-routes`; `pnpm --filter web check:lint`; `pnpm --filter web check:types`; focused route test and full Web suite pass, plus seeded live direct-card and overflow focus recovery and visual evidence.

### R1 — Integrated read-only review

#### R1-T1 — Audit the integrated candidate and visual/runtime risk

- **Status/owner:** `completed` — `reviewer`
- **Depends/parallel:** Starts only after F5 and F6 diffs are integrated; may run alongside F7’s non-readiness sensors. Reuse this same Reviewer after any correction.
- **Paths:** Read-only review of all changed Core, Validation, Server, Web, migration, generated-route, REST-example, test and design-reference consumers; no file edits.
- **Contract:** All RF/CA; every MV; the complete technical, validation and Design Contracts.
- **Outcome:** Reviewer reports cross-Builder contract drift, authorization/privacy/concurrency issues, missing coverage, widget-tree/design mismatches, browser failures and stale evidence without deciding readiness.
- **Rules:** `documentation/rules/sdd-rules.md`; `documentation/rules/code-conventions-rules.md`; all Rule Pack paths recorded in Spec §5; `documentation/agents/reviewer-agent.md`.
- **Exit:** Orchestrator verified the integrated diff and runtime evidence, recorded findings in [evaluation.md](evaluation.md), completed correction waves, and obtained the same Reviewer’s final recheck with no implementation defects.

### F7 — Integrated validation and handoff

#### F7-T1 — Execute the Quality Gate and route to conclusion

- **Status/owner:** `completed` — `orchestrator`
- **Depends/parallel:** Depends on integrated F5/F6. A blocking finding, stale required evidence or an acceptance requirement without current evidence blocks readiness; documented `partial` manual/visual delivery classifications remain explicit and do not become inferred passes.
- **Paths:** Evaluation only plus validation artifacts; no implementation ownership changes. Generated migration/route artifacts and inherited worktree changes are audited before handoff.
- **Contract:** CA-01–CA-09; MV-01–MV-04; final handoff condition in the create-plan contract.
- **Outcome:** All automated boundaries, real PostgreSQL/REST/Auth/browser flows, visual states, permissions, transaction/outbox behavior, keyboard paths, narrow viewport states and final Spec-tree comparisons are evidenced without claiming unexecuted results.
- **Rules:** `documentation/rules/sdd-rules.md`; `AGENTS.md`; `documentation/tooling.md`; `documentation/rules/controllers-testing-rules.md`; `documentation/rules/web-app-routing-rules.md`; `documentation/rules/widget-testing-rules.md`; use the repository’s Playwright CLI/authenticated-browser workflow and leave shared Docker services unchanged.
- **Exit:** Run the Spec commands: Core/Validation/Server/Web coverage, typechecks, lint, architecture checks, route generation, migration review/application and focused Playwright CLI; execute the applicable MV-01–MV-04 authenticated URL/content, REST, persistence, keyboard, responsive and recovery checks; record unexecuted manual scenarios as `partial` and classify console/network output. Final CI is green on all three delivery PR heads; the repeated Server coverage drift was resolved by rebasing the documented floor to the measured current develop baseline. No blocking finding remains. Unexecuted manual/visual scenarios stay classified as partial. `pnpm check:test-integrity` was run only through the inherited local untracked script/config and is not claimed as PR evidence.

# Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Runtime | Core calendar/detail/filter/action/access use cases | CA-01–CA-07 | Spec §4 automated matrix | `./evaluation.md` `EV-087` | `passed` |
| Runtime | Shared scheduling/Consultation schemas | CA-01, CA-04–CA-07, CA-09 | Spec §3 Validation | `./evaluation.md` `EV-088` | `passed` |
| Runtime | Server calendar/detail/filter/slots/action HTTP | CA-02–CA-07, CA-09 | Integration Contract | `./evaluation.md` `EV-089`, including Testcontainers migration application | `passed` |
| Runtime | Consultation GET/transition authorization and outbox | CA-04, CA-05, CA-07, CA-09 | PRD Consulta v12; Spec §3 | `./evaluation.md` `EV-089` and focused actor access test | `passed` |
| Runtime | Web widget/hook boundary and route contract | CA-01–CA-04, CA-08–CA-09 | Spec widget tree and route test | `./evaluation.md` `EV-090`–`EV-091` | `passed` |
| Migration metadata | Drizzle snapshot ancestry on target base | CA-07, CA-09 | Existing migration history | `./evaluation.md` `EV-092`; same collision reproduced on clean `origin/develop` | `partial` |
| Manual | MV-01 — calendário real, filtros e overflow | CA-01–CA-03 | Spec MV-01 | `./evaluation.md` with authenticated URL, REST, DB, trace and screenshot identifiers | `partial` |
| Manual | MV-02 — detalhe e Consulta | CA-04 | Spec MV-02 | `./evaluation.md` with role matrix, direct-ID/Intake 404s, focus and screenshot | `partial` |
| Manual | MV-03 — cancelamento, remarcação e concorrência | CA-05–CA-07 | Spec MV-03 | `./evaluation.md` with real requests, persistence/outbox, retry and screenshots | `partial` |
| Manual | MV-04 — perfis, estados, mobile e acessibilidade | CA-08–CA-09 | Spec MV-04 | `./evaluation.md` with role/viewport/keyboard/network evidence | `partial` |
| Visual | Weekly calendar — `e9hQ5V.png`, 1417 × 900 | CA-01–CA-03, CA-08 | [e9hQ5V.png](design/e9hQ5V.png); manifest | Populated live capture `/tmp/hms-agenda-week-seeded-1417x900.png`; exact reference parity remains open | `partial` |
| Visual | Monthly overflow — `aDlqK.png`, 1200 × 900 | CA-01–CA-03, CA-08 | [aDlqK.png](design/aDlqK.png); manifest | Populated live capture `/tmp/hms-agenda-month-seeded-1200x900.png`; overflow focus also covered live | `partial` |
| Visual | Appointment details — `gQg7t.png`, 621 × 655 | CA-04–CA-06, CA-08 | [gQg7t.png](design/gQg7t.png); manifest | Live capture `/tmp/hms-appointment-details-621x655.png`; exact reference parity remains open | `partial` |
| Visual | Client filter — `c7tlDG.png`, 621 × 605 | CA-03, CA-08 | [c7tlDG.png](design/c7tlDG.png); manifest | Live capture `/tmp/hms-agenda-client-filter-621x605.png`; exact reference parity remains open | `partial` |
| Visual | Reschedule — `yVAoI.png`, 600 × 834 | CA-06–CA-08 | [yVAoI.png](design/yVAoI.png); manifest | Live capture `/tmp/hms-reschedule-600x834.png`; fixed-lawyer behavior follows RF-06 and exact reference parity remains open | `partial` |
| Visual | Cancel confirmation — `KIhkn.png`, 513 × 365 | CA-05, CA-07–CA-08 | [KIhkn.png](design/KIhkn.png); manifest | Live capture `/tmp/hms-cancel-confirm-513x365.png`; exact reference parity remains open | `partial` |
| Visual | Accepted supplemental mobile agenda — 390 × 844 | CA-01–CA-03, CA-08 | `agenda-mobile` in [manifest.md](design/manifest.md) | Populated live capture `/tmp/hms-agenda-seeded-mobile-390x844.png`; no horizontal overflow observed | `partial` |
| Visual | Accepted supplemental agenda states — 1417 × 900 | CA-02, CA-08–CA-09 | `agenda-states` in manifest | `./evaluation.md` `VIS-08`–`VIS-13`; captures inspected; shared Devtools overlay noted | `partial` |
| Visual | Accepted supplemental agenda states — 390 × 844 | CA-08–CA-09 | `agenda-states` in manifest | `./evaluation.md` `VIS-14`–`VIS-18`; no horizontal overflow; captures inspected | `partial` |
| Visual | Accepted supplemental dialogs — 390 × 844 | CA-04–CA-08 | `dialog-responsive` in manifest | `./evaluation.md` `VIS-05-R12`, `VIS-10`; responsive states inspected; exact yVAoI parity remains partial | `partial` |
| Review | Integrated candidate and final visual/runtime surfaces | All RF/CA/MV | Integrated Reviewer contract | `./evaluation.md` FND-036 recheck and final conformance record | `passed` |

Conclusion record: all implementation phases/tasks are `completed`; Spec revision 13 is frozen; local integrated sensors and the final SHA-specific Core/Server/Web/size/review CI gates passed across #180/#181/#183. Executed manual, keyboard, recovery and responsive evidence is recorded; unexecuted role/concurrency/broker scenarios and exact visual parity remain explicitly `partial`. The integrated Reviewer and automated Hermes reviews passed; FND-038/FND-039 are resolved; no blocker remains.


### F8 — Lawyer transfer during rescheduling (Spec revision 12)

#### F8-T1 — Amend Core and Validation contracts

- **Status/owner:** `completed` — `builder_core` + `builder_validation`
- **Depends/parallel:** Depends on the frozen revision 12 contract; F8-T3 waits for Core/Validation signatures before implementation.
- **Paths:** `packages/core/src/scheduling/**`; `packages/core/src/shared/interfaces/{index.ts,rescheduled-appointment-consultation-provider.ts}`; `packages/validation/src/scheduling/**`.
- **Contract:** RF-06–RF-07; CA-06–CA-07; Spec §3 Core/Validation, ordered dual-schedule locking, active lawyer validation, duration-preserving destination slot validation and existing Consultation synchronization.
- **Outcome:** Core accepts optional `lawyerId` (defaulting to the current lawyer for compatibility), rejects inactive/missing-schedule targets, returns target-schedule slots, and records both schedule IDs in reschedule facts.
- **Rules:** Core Package, Use Case Testing, Validation Package and Messaging Rules; keep framework/persistence details out of Core.
- **Exit:** Schema/Core consistency is reviewed; the Core owner test, typecheck, architecture and full coverage pass (`EV-082`–`EV-083`); Validation tests pass (`EV-085`).

#### F8-T2 — Implement atomic cross-agenda persistence and Consultation synchronization

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F8-T1 and migration review; can proceed alongside F8-T3 against the frozen API contract.
- **Paths:** `apps/server/src/scheduling/rest/controllers/{list-reschedule-slots.controller.ts,reschedule-appointment.controller.ts}`; scheduling change/appointment repositories and models; `apps/server/src/consultation/database/drizzle/repositories/drizzle-rescheduled-appointment-consultation-provider.ts` and module/tokens; `apps/server/src/shared/database/drizzle/migrations/0055_faulty_red_hulk.sql`, `meta/0055_snapshot.json` and `_journal.json`.
- **Contract:** RF-06–RF-07; CA-06–CA-07; Spec §3 REST, Database, migration and cross-module Provider contracts.
- **Outcome:** Revalidate active lawyer and availability under deterministic source/destination schedule locks; update appointment schedule, the existing pending Consultation’s `assignedLawyerId`, history and outbox in one transaction; rollback together on any failure.
- **Rules:** REST, Database, Server App, Provision and Messaging Rules; Consultation owns its table and adapter, Scheduling owns appointment transaction/history.
- **Exit:** Migration 0055 is generated, applied and catalog-checked; transfer/REST suites, Server types, lint, architecture and prior full Server coverage are recorded in Evaluation. The live cross-lawyer PATCH, Consultation sync, persisted history and cleanup are verified in `EV-074`/`EV-075`.

#### F8-T3 — Align the reschedule dialog with Pencil yVAoI

- **Status/owner:** `completed` — `builder_web`
- **Depends/parallel:** Depends on the frozen Core/Validation API; parallel with F8-T2.
- **Paths:** reschedule dialog widget/hook, scheduling service/action/slot hooks, active-lawyer option source, and owning widget/hook contracts.
- **Contract:** RF-06–RF-08; CA-06–CA-08; `design/yVAoI.png` at 600 × 834 and mobile adaptation at 390 × 844.
- **Outcome:** Show current schedule, active lawyer selector, destination date/time slots, duration/time zone and before/after summary; changing lawyer/date clears an obsolete slot, refreshes availability and confirmation submits lawyerId with the selected slot.
- **Rules:** UI, Widget Testing, REST, Validation and `documentation/design.md`; use design tokens and accessible labels, keyboard selection, visible focus and responsive dialog scrolling.
- **Exit:** Current 600 × 834 and 390 × 844 captures are inspected against yVAoI; lawyer/slot selection and 409 recovery pass the focused browser path (`EV-074`, `EV-084`). Layout differences and the shared development badge are recorded in `VIS-05-R12`/`VIS-10`.

#### F8-T4 — Integrated review and evidence reconciliation

- **Status/owner:** `completed` — `orchestrator` + `reviewer`
- **Depends/parallel:** Depends on F8-T1–T3.
- **Paths:** Read-only candidate review; `evaluation.md`; visual and validation artifacts only when authorized.
- **Contract:** CA-06–CA-08 and all F8 technical contracts.
- **Outcome:** Reviewer found and rechecked one cancellation monotonic-revision defect (FND-036); Core fixed it and the focused regression plus full Core coverage passed. Cross-lawyer API/database and dialog behavior is recorded with exact evidence.
- **Rules:** SDD and all F8 Rule Pack documents.
- **Exit:** Revision 13 implementation review found no remaining implementation defect; see `EV-081`–`EV-084` and `FND-036`.
