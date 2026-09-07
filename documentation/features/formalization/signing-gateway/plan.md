---
title: Gateway seguro de assinatura da Formalização — implementation plan
status: in_progress
spec: ./spec.md
spec_revision: 13
evaluation: ./evaluation.md
jira_tickets:
  - SCRUM-144
  - SCRUM-140
  - SCRUM-128
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/24051713
updated_at: 2026-09-07
---

## Execution status

- **Spec:** [`spec.md`](./spec.md), revision `13`, status `in_progress`; it aggregates every current worktree change under the explicit accepted-risk conclusion waiver.
- **Plan rationale:** The delivery crosses Core, Validation, Server persistence/providers/jobs/REST, Web UI, private provider infrastructure, migrations, security boundaries and authenticated browser validation; dependent phases and recovery state require a durable execution ledger.
- **Current phase:** `F8` — conclusion preflight — `completed`; PATH-03 covers every current worktree change under revision 13.
- **Next action:** Obtain publication authority, create the required atomic commit set, publish/update the pull request and wait for green PR CI through `conclude-spec`.
- **Active blockers:** No feature-local evidence blocker remains for conclusion. MV-01–MV-08, remaining visual evidence, G-01/G-02/G-05/G-06 and FND-047/FND-049/FND-050/FND-052 are explicitly accepted risks, not passed or technically resolved. G-04 and repository-wide structural/PR-CI controls remain mandatory.
- **Active Builders:** None. Direct implementation replaced delegated/reviewer work by explicit user direction; the Orchestrator owns the remaining integration evidence.
- **Recovery boundary:** F1–F7 preserve the integrated revision-5 baseline and its evidence. F10–F13 replace only the cardinality, persistence, provider, REST and Gateway UI behavior superseded by revisions 6–9; unaffected security, OTP, proxy-hardening and internal sending behavior remains subject to fresh integrated regression evidence.
- **Shared ownership:** The Orchestrator owns root/package installation and lockfiles, Docker/env/configuration changes, generated Drizzle migration/snapshot/journal and `routeTree.gen.ts`, final integration, current Spec conformance, and the final evidence verdict. No Builder edits shared/generated artifacts.

## Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `builder_core` | F1 | Revision-5 Core baseline | — | — | `completed` | Historical revision-5 Core implementation and evidence are preserved; superseded package cardinality is replaced in F10. |
| 2 | `builder_validation` | F2 | Revision-5 Validation baseline | F1 | F3 | `completed` | Historical revision-5 schemas are preserved; superseded DTO shapes are replaced in F11. |
| 2 | `builder_server` / `builder_fix_server` | F3 | Revision-5 persistence baseline | F1 | F2 | `completed` | Historical document-scoped models and adapters are the forward-migration baseline for F12. |
| 3 | `orchestrator` | F4 | Revision-5 migration/runtime baseline | F2, F3 | — | `completed` | Migration `0042_signing_gateway`, provider runtime and shared wiring remain the baseline; revision-10 generated changes move to F8. |
| 4 | `builder_server` | F5 | Revision-5 Server baseline | F4 | — | `completed` | Existing send/provider/Gateway integration is preserved for targeted replacement and regression in F12. |
| 5 | `builder_web` | F6 | Revision-5 internal Web baseline | F5 | — | `completed` | Existing protected send/review/cancel behavior remains the regression baseline for F13 and F8. |
| 6 | `builder_web` | F7 | Revision-5 public Gateway baseline | F5, F6 | — | `completed` | Existing one-document Gateway, auth and hardened provider proxy flow is the migration baseline for F13. |
| 7 | `builder_core` | F10 | Request-scoped multi-document Core contracts | F1–F7 baseline | — | `completed` | Canonical package entities, ports, state derivation, use cases, events and focused tests pass Core sensors. |
| 8 | `builder_validation` | F11 | Revision-10 REST/event schemas | F10 | — | `completed` | Package document-list/acknowledgement/start/result/event schemas pass Validation sensors and consumer compilation. |
| 9 | `orchestrator` | F12 | Persistence, provider, jobs and REST migration | F10, F11 | — | `completed` | Request-level persistence, one shared Documenso envelope, item/recipient mappings, request-scoped Inngest, hardened Gateway REST/webhook boundaries and a consolidated migration pass focused, Docker-backed and disposable-database evidence. |
| 10 | `orchestrator` | F13 | Multi-document Gateway tabs and all-read flow | F11, F12 | — | `completed` | Implementation and focused/full Web tests pass; remaining real-browser ceremony evidence is waived as accepted risk by revision 12, with no claim that it passed. |
| 11 | `orchestrator` | F8 | Revision-13 conclusion preflight | F13 | — | `completed` | PATH-03 passes with 1,279 declared/current paths, zero failed checks and zero unrelated changes; PR CI remains mandatory after publication. |
| 12 | `orchestrator` | F9 | Integrated read-only implementation review | F8 | — | `waived` | Waived by explicit user direction on 2026-09-04; no reviewer agent will be used for the remaining implementation. |

### F1 — Core signing lifecycle contracts

#### F1-T1 — Implement the Core request, Gateway and lifecycle contracts

- **Status/owner:** `completed` — `builder_core` (verified by Orchestrator)
- **Depends/parallel:** Starts after the Orchestrator records Spec revision 5; no parallel Core owner; F2 and F3 become dependency-ready after the Core contracts land.
- **Paths:** `packages/core/src/formalization/domain`, `packages/core/src/formalization/interfaces`, `packages/core/src/formalization/use-cases`, `packages/core/src/communication/domain/events`, and the exact Core barrels, fakers, existing Formalization projection/source-reader/service paths listed in the Spec affected-path ledger.
- **Contract:** RF-01–RF-27 and RF-29–RF-38; CA-01–CA-15 and CA-17–CA-22; preserve the exact state tables, one-email channel, request graph, atomic projections, token/OTP/session rules, provider ports and event declarations from the Spec.
- **Outcome:** Domain entities, structures, errors, events, repository/provider/transaction interfaces, use cases, request/response records and tests express the complete signing lifecycle without importing Validation or embedding provider/transport logic in Core.
- **Rules:** `documentation/rules/code-conventions-rules.md` (`Antipatterns to Avoid`); `documentation/rules/core-package-rules.md` (`Antipatterns to Avoid`, Core/Validation boundary and business logic placement); `documentation/rules/use-case-testing-rules.md` (`Antipatterns to Avoid`).
- **Exit:** Run focused Core tests, lint, type checks and architecture checks; verify every declared Core path and export, monotonic/idempotent state transitions, fake-clock/race coverage, and no Core-to-Validation dependency before marking F1 complete.

### F2 — Signing Gateway Validation boundary

#### F2-T1 — Add strict REST and event schemas

- **Status/owner:** `completed` — `builder_validation` (verified by Orchestrator)
- **Depends/parallel:** Depends on F1 canonical values and declarations; runs in parallel with F3 persistence work; no package configuration or generated-file edits.
- **Paths:** `packages/validation/src/formalization/signing-gateway`, `packages/validation/src/formalization/index.ts`, and the exact sending, Gateway, webhook and versioned-event schema files listed in the Spec.
- **Contract:** RF-01–RF-05, RF-09–RF-14, RF-26–RF-27 and RF-29–RF-38; CA-01–CA-05, CA-08, CA-14–CA-15 and CA-17–CA-22; strict unknown-key rejection, six-digit OTP, one-email channel and absence of provider secrets/links.
- **Outcome:** Validation exposes strict Zod schemas and inferred DTO/input types for internal sending, public Gateway operations and versioned events while consuming canonical Core values and remaining test-free locally.
- **Rules:** `documentation/rules/code-conventions-rules.md` (`Antipatterns to Avoid`); `documentation/rules/validation-package-rules.md` (`Antipatterns to Avoid`, no local tests and canonical Core consumption); `documentation/rules/core-package-rules.md` (`Antipatterns to Avoid`) for shared declarations.
- **Exit:** Run `pnpm --filter @hms/validation lint`, `check-types` and `check:architecture`; compile Server/Web consumers against the schemas, inspect inferred types for no raw token/provider URL/contact leakage, and verify the exact schema/export inventory.

### F3 — Request graph persistence and transaction foundation

#### F3-T1 — Implement Drizzle models, repositories and atomic transaction ports

- **Status/owner:** `completed` — `orchestrator` (integrated F12 evidence recorded at EV-228; remaining fresh ceremony waived by EV-235)
- **Depends/parallel:** Depends on F1 Core ports and state values; runs in parallel with F2; do not generate or hand-edit migration metadata.
- **Paths:** `apps/server/src/formalization/database`, `apps/server/src/shared/database/drizzle/schema.ts`, all request-side and Gateway models/types/mappers/repositories, existing Formalization projection paths, database module tokens/barrels, and `apps/server/src/formalization/database/formalization-signature-gateway-transaction.ts` from the Spec ledger.
- **Contract:** RF-09–RF-25 and RF-31–RF-38; CA-09–CA-14 and CA-18–CA-21; enforce one request/document/recipient graph, one email delivery channel, hashed/encrypted secret boundaries, leases, dedupe, version checks, advisory/row locks and atomic `signatureStatus` projections.
- **Outcome:** Real PostgreSQL persistence types and repositories implement the exact Core ports, all new tables/constraints are represented, and the transaction adapter can atomically exchange, verify, provision, deliver, reconcile and cancel without provider calls.
- **Rules:** `documentation/rules/database-layer-rules.md` (`Antipatterns to Avoid`, module-owned models, plural repository operations and no repository implementation tests); `documentation/rules/server-app-layer-rules.md` (`Antipatterns to Avoid`); `documentation/rules/code-conventions-rules.md` (`Antipatterns to Avoid`).
- **Exit:** Run focused repository/transaction tests against real PostgreSQL, test unique/FK/check constraints and concurrency races, verify no raw token/link/provider credential columns, and report the exact model inventory to the Orchestrator for migration generation.

### F4 — Migration, dependencies and shared runtime wiring

#### F4-T1 — Generate and integrate shared artifacts without Builder overlap

- **Status/owner:** `completed` — `orchestrator`
- **Depends/parallel:** Starts after F2 and F3 reports are verified; blocks F5 until dependency/runtime configuration and disposable migration evidence are available.
- **Paths:** `apps/server/src/shared/database/drizzle/migrations/0042_signing_gateway.sql`, its `meta/0042_snapshot.json` and `_journal.json` update, `apps/server/package.json`, `pnpm-lock.yaml`, `docker-compose.yaml`, certificate script/secrets/ignore/env paths, and other root/shared paths named by the Spec.
- **Contract:** RF-12–RF-14, RF-18–RF-25, RF-28 and RF-31–RF-38; CA-08, CA-10–CA-14, CA-16 and CA-18–CA-21; G-04 provider pin, private PostgreSQL/Documenso, Resend version, certificate/runtime defaults and no route exposure.
- **Outcome:** The current `ready_for_sending` baseline has one reviewed additive migration, pinned local provider/runtime configuration, approved Resend dependency metadata and routes remain dark until later phases.
- **Rules:** `documentation/rules/database-layer-rules.md` (`Antipatterns to Avoid`, generated migration review); `documentation/rules/provision-layer-rules.md` (`Antipatterns to Avoid`, environment/provider access); `documentation/tooling.md`; `documentation/rules/code-conventions-rules.md` (`Antipatterns to Avoid`).
- **Exit:** Run the documented migration generator, inspect SQL/snapshot/journal, apply forward migration to a disposable database, run provider version/health checks, verify package lock consistency and confirm no Builder changed generated/shared artifacts.

### F5 — Server sending, provider, delivery and REST integration

#### F5-T1 — Wire internal sending, provider operations, Communication and Gateway REST

- **Status/owner:** `completed` — `orchestrator` (integrated F12 evidence recorded at EV-228; remaining fresh ceremony waived by EV-235)
- **Depends/parallel:** Depends on F4 generated schema/runtime and F2 validation; all Server application paths are owned by this reused `builder_server` phase; F6/F7 wait for integrated REST contracts.
- **Paths:** `apps/server/src/formalization/provision`, `apps/server/src/formalization/messaging`, `apps/server/src/formalization/rest`, feature modules/fixtures/constants/barrels, `apps/server/src/communication`, `apps/server/src/shared/communication`, `apps/server/src/shared/provision`, `apps/server/rest-client/formalization`, and the exact Server paths in the Spec ledger.
- **Contract:** RF-03–RF-25 and RF-28–RF-38; CA-02–CA-14, CA-16 and CA-18–CA-21; real request/response, authorization, cookie/CSRF/Origin, provider alias/proxy, Resend, Inngest retry/lease, webhook/reconciliation, artifact and cancel-all behavior.
- **Outcome:** Nest composition exposes one thin controller per action, real PostgreSQL transactions, pinned Documenso V2 provider/proxy, encrypted credentials, Resend delivery, versioned jobs/events and recoverable REST behavior with no raw secret/provider URL disclosure.
- **Rules:** `documentation/rules/server-app-layer-rules.md` (`Antipatterns to Avoid`); `documentation/rules/provision-layer-rules.md` (`Antipatterns to Avoid`); `documentation/rules/rest-layer-rules.md` and `documentation/rules/controllers-testing-rules.md` (`Antipatterns to Avoid`); `documentation/rules/messaging-layer-rules.md` and `documentation/rules/jobs-testing-rules.md` (`Antipatterns to Avoid`).
- **Exit:** Run Server code/types/architecture checks, controller tests with real Nest/Supertest/PostgreSQL, `test:inngest`, provider/proxy and Resend adapter tests; exercise real request/response plus persistence/authorization for send, Gateway, webhook and cancel; classify all failures before handoff.

### F6 — Internal review, send and cancellation experience

#### F6-T1 — Implement the protected Formalization sending surface

- **Status/owner:** `completed` — `orchestrator` (integrated F13 evidence recorded at EV-229; remaining fresh ceremony waived by EV-235)
- **Depends/parallel:** Depends on F5 REST contracts and F1/F2 types; precedes F7 because public and internal route/service composition share Web boundaries; no route-tree generation by the Builder.
- **Paths:** `apps/web/src/rest/services/formalization-service.ts` and tests, internal Formalization sending hooks/widgets/dialogs and tests, plus the exact existing configuration paths listed in the Spec and design manifest.
- **Contract:** RF-29–RF-38; CA-17–CA-22; review of immutable PDFs/assignments/email/message, confirm-once, progress/partial failure, locked editing, cancel-all, safe retry and preserved history.
- **Outcome:** The existing Formalization configuration gains the exact review, confirming, provisioning/delivery, partial-failure and cancel-all widget states without duplicating the Formalization page or exposing CPF/provider data.
- **Rules:** `documentation/rules/ui-layer-rules.md` (`Antipatterns to Avoid`); `documentation/rules/rest-layer-rules.md` (`Antipatterns to Avoid`); `documentation/rules/widget-testing-rules.md` (`Antipatterns to Avoid`); `documentation/rules/code-conventions-rules.md` (`Antipatterns to Avoid`).
- **Exit:** Run focused Web tests and route/type/architecture checks; compare every affected internal widget to the exact Spec tree and manifest references, exercise keyboard, 390×844, 200% zoom, light/dark and reduced-motion states, inspect console/failed requests, and capture fresh Playwright CLI screenshots for each affected design state.

### F7 — Public Signing Gateway experience

#### F7-T1 — Implement the public route, authentication and fail-closed signing flow

- **Status/owner:** `completed` — `orchestrator` (integrated F13 evidence recorded at EV-229; remaining fresh ceremony waived by EV-235)
- **Depends/parallel:** Depends on F5 Server endpoints and F6 shared Web service/configuration; remains one sequential `builder_web` ownership chain; generated `routeTree.gen.ts` is deferred to F8.
- **Paths:** `apps/web/src/routes/assinaturas/acesso`, `apps/web/src/routes/login`, route constants/middleware/REST context/axios/provision CSRF paths, `apps/web/src/rest/axios/signing-gateway-rest-client.ts`, signing Gateway service/hooks/widgets/tests, and `apps/web/tests/routes/formalization/signing-gateway.test.tsx` exactly as listed in the Spec.
- **Contract:** RF-01–RF-27; CA-01–CA-16; fragment-only exchange, safe return target, client email OTP, collaborator session, private PDF, acknowledgement, provider handoff, submission/result states, no raw token/provider URL and all unavailable/locked/reconciliation states.
- **Outcome:** A thin leaf route renders the complete typed Gateway widget tree with cookie-bound REST, accessible one-input OTP, private document reading, session-bound proxy entry, result-only completion and generic fail-closed errors for every required actor/state.
- **Rules:** `documentation/rules/ui-layer-rules.md` (`Antipatterns to Avoid`); `documentation/rules/web-app-routing-rules.md` (`Antipatterns to Avoid`, generated route tree read-only); `documentation/rules/rest-layer-rules.md` (`Antipatterns to Avoid`); `documentation/rules/widget-testing-rules.md` (`Antipatterns to Avoid`).
- **Exit:** Run focused Web tests and Playwright CLI coverage with real server-backed evidence where applicable; compare the exact Spec widget tree, test keyboard/narrow viewport/200%/themes/reduced motion, inspect console and failed requests, and capture a fresh screenshot for every affected canonical and derived design state.

### F10 — Request-scoped multi-document Core contracts

#### F10-T1 — Replace document-scoped signing ownership with one package contract

- **Status/owner:** `completed` — `builder_core` agent `01a068d8-cddd-7530-95e2-c806a27fd737` (`Volta`), accepted by the same implementation reviewer at EV-226
- **Depends/parallel:** Starts from the integrated revision-5 baseline after revision-10 kickoff is recorded; blocks F11/F12/F13 and has no concurrent Core owner.
- **Paths:** `packages/core/src/formalization/**` and the exact Core event declarations under `packages/core/src/communication/**` listed in the revision-10 affected-path ledger; no app, Validation, generated or SDD paths.
- **Contract:** RF-06–RF-25 and RF-31–RF-38; CA-04–CA-14 and CA-18–CA-22.
- **Outcome:** Core owns one request-level envelope/provisioning/cancellation/session/binding/protocol lifecycle, immutable recipient-document assignments, envelope-item resources, per-document acknowledgements, all-read provider entry, one coherent envelope-scoped provider observation, independent `0..n` receipt updates, atomic receipt claim/fail/receipt-only-complete transaction operations with a fresh per-attempt token, strict neutral observation/reconciliation-only hint processing, one batch-only observation transaction, one signed artifact per request document and request-wide provider evidence/certificate.
- **Rules:** `documentation/rules/code-conventions-rules.md` (`Antipatterns to Avoid`); `documentation/rules/core-package-rules.md` (`Antipatterns to Avoid`, Core/Validation boundary); `documentation/rules/use-case-testing-rules.md` (`Antipatterns to Avoid`).
- **Exit:** Run the revision-10 focused use-case suites plus `pnpm --filter @hms/core test`, `lint`, `check-types` and `check:architecture`; require neutral receipt fields only; primary-key claim lookup; a fresh `IdProvider` claim token per execution; exact-token claim failure/observation finalization/receipt-only completion; strict closed discriminator/status/assignment/version/count parsing; reconciliation-only and every terminal partial hint publish trusted reconciliation with zero graph mutation; no fabricated request ID; one transaction-owned aggregate derivation with no caller request/Formalization status; a two-recipient/two-item coherent provider snapshot; every expected item exactly once per recipient; `receiptUpdates: []` for scheduled reconciliation; independent duplicate-receipt semantics; conflict/retry; freshly reloaded submitted-only graph before confirmation; every signed PDF plus request-wide evidence/certificate; in-place authenticated-to-result session conversion preserving only existing hashes/expiry and minting no replacement secret; complete other-session/binding/invitation revocation; first-entry/active-binding alias rotation and old-alias invalidation; acknowledgement session expiry and exact collaborator source-person/role/assignment; context signing and lost-submission recovery; no mutable current-configuration equality, singular compatibility fields, per-recipient request/Formalization CAS loop, global item-ID rejection across recipients, runtime native `Error` or Core-to-Validation/provider-name coupling.

### F11 — Revision-10 REST and event schemas

#### F11-T1 — Align strict public/internal DTOs with the package lifecycle

- **Status/owner:** `completed` — `builder_validation` agent `01a05f45-8a3c-7d60-b5b3-63af766fb2ee`, verified by the Orchestrator at EV-227
- **Depends/parallel:** Depends on F10 canonical Core structures and events; blocks F12/F13; no concurrent Validation owner.
- **Paths:** `packages/validation/src/formalization/signing-gateway/**` and `packages/validation/src/formalization/index.ts` exactly as classified by the revision-10 affected-path ledger; no Core, app, generated or SDD paths.
- **Contract:** RF-01–RF-19 and RF-31–RF-38; CA-01–CA-15 and CA-18–CA-22.
- **Outcome:** Strict schemas expose ordered package documents, acknowledged IDs, document-scoped acknowledgement, package start, canonical result statuses and request-level versioned events without provider credentials, raw contacts or duplicate status vocabularies.
- **Rules:** `documentation/rules/code-conventions-rules.md` (`Antipatterns to Avoid`); `documentation/rules/validation-package-rules.md` (`Antipatterns to Avoid`, no local Validation tests); `documentation/rules/core-package-rules.md` (`Antipatterns to Avoid`).
- **Exit:** Run `pnpm --filter @hms/validation lint`, `check-types` and `check:architecture`, then compile Server/Web consumers; inspect strict unknown-key rejection, canonical Core enum consumption and complete exports without adding a Validation test suite.

### F12 — Persistence, provider, jobs and REST migration

#### F12-T1 — Implement one shared envelope through the Server boundary

- **Status/owner:** `completed` — `orchestrator` (integrated F12 evidence recorded at EV-228; remaining fresh ceremony waived by EV-235)
- **Depends/parallel:** Depends on F10 and F11; blocks F13. The Builder owns only `apps/server/**`; root dependencies, environment templates and generated migration metadata remain Orchestrator-owned in F8.
- **Paths:** `apps/server/src/formalization/**`, `apps/server/src/communication/**`, `apps/server/src/shared/communication/**`, `apps/server/src/shared/database/drizzle/schema.ts`, and `apps/server/rest-client/formalization/**` exactly as listed in the revision-10 affected-path ledger; no package, Web, root/generated migration or SDD paths.
- **Contract:** RF-03–RF-25 and RF-28–RF-38; CA-02–CA-14 and CA-16–CA-22.
- **Outcome:** Real PostgreSQL composition, Documenso v2.17 multipart adapter, `DocumensoWebhookNormalizer`, Communication delivery, Inngest jobs and one-action controllers persist one request envelope, item/recipient mappings, package sessions/bindings/protocols and per-document acknowledgements. The database adapter implements atomic first provider entry and alias-hash rotation, complete access-revoking/result-session-rotating submission and graph-owned aggregate derivation. Raw webhook events become encrypted neutral hints before Core receipt persistence; terminal partial hints are receipt-only reconciliation, one envelope-scoped provider read feeds one atomic authoritative transaction, receipt-bearing processing uses transaction-owned primary-key claim generations/receipt-only completion and five retriable job retries, receipt-free scheduled reconciliation has separate executable rollback coverage, and each signed PDF plus request-wide provider evidence/certificate is preserved.
- **Rules:** `documentation/rules/server-app-layer-rules.md`, `provision-layer-rules.md`, `database-layer-rules.md`, `rest-layer-rules.md`, `controllers-testing-rules.md`, `messaging-layer-rules.md` and `jobs-testing-rules.md`, including every `Antipatterns to Avoid` subsection.
- **Exit:** Run focused provider/normalizer/transaction/controller/job suites, real Dockerized `test:inngest`, Server `test`, `check:code`, `check:types` and `check:architecture`; prove real request/response, authorization and PostgreSQL effects for two PDFs/two recipients, one envelope, one invitation per recipient, item mappings and per-document acknowledgements. Race first provider entry, lost-response retry and a second stale alias to prove one binding, atomic `reading -> signing`, rotated hash and rejection of the old alias. Race successful/duplicate/conflicting submission to prove normalized observation persistence, in-place presenting-session conversion to result with unchanged token/device/CSRF hashes and expiry, complete other-session/binding/invitation revocation, transaction-derived partial/submitted request/Formalization state, no replacement secret and result-only refresh after a lost response. The normalizer must prove supported/unknown raw-to-neutral mapping, canonical dedupe, current mapping/version resolution, encryption context, no raw persistence/logging and fail-closed ambiguity without provider calls. The webhook job must claim by generated receipt primary key with a unique token/30-second expiry; prove stale claim A cannot finalize after claim B, attempts increment once per successful claim/reclaim and never for busy/non-due/processed rows, complete reconciliation-only and terminal-partial-hint success/replay/stale-claim/malformed/publication/zero-graph behavior, transaction-owned non-terminal aggregate derivation, `retry_required` under `retries: 5`, exhausted auditable failures, and late graph-conflict rollback while processed observation replay can apply newer safe state. Scheduled reconciliation must roll back all recipient/document/request/Formalization writes on a later conflict and leave receipt rows unchanged. Mocked repositories or route transport alone are insufficient.

### F13 — Multi-document Gateway tabs and all-read flow

#### F13-T1 — Present and acknowledge the whole package before one provider ceremony

- **Status/owner:** `completed` — `orchestrator` (integrated F13 evidence recorded at EV-229; remaining fresh ceremony waived by EV-235)
- **Depends/parallel:** Depends on F11 schemas and F12 real endpoints; no concurrent Web owner; `routeTree.gen.ts` remains Orchestrator-owned in F8.
- **Paths:** `apps/web/src/rest/**`, `apps/web/src/ui/formalization/**`, `apps/web/src/routes/assinaturas/acesso/**`, the exact login/middleware/constants paths and `apps/web/tests/routes/formalization/signing-gateway.test.tsx` named in the revision-10 affected-path ledger; no Core, Validation, Server, generated route tree or SDD paths.
- **Contract:** RF-01–RF-15 and RF-26–RF-27; CA-01–CA-15. Design Contract states `reading` from `design/manifest.md`, nodes UGhOX/Cl6te amended by revision 6, and references `04-read-document.png`, `05-confirm-signature.png`, `09-collaborator-read.png` and `10-collaborator-confirm.png`.
- **Outcome:** The public leaf route lists every package document in a semantic keyboard tablist, uses one browser-native PDF viewer for the active document, persists one acknowledgement per document, disables provider entry until all are read and enters the hardened Documenso proxy once; no duplicate zoom controller or separate acknowledgement screen remains.
- **Rules:** `documentation/rules/ui-layer-rules.md`, `rest-layer-rules.md`, `widget-testing-rules.md`, `web-app-routing-rules.md` and `code-conventions-rules.md`, including every `Antipatterns to Avoid` subsection; `documentation/design.md`.
- **Exit:** Run focused service/hook/widget/route tests and Web `test`, `check:code`, `check:types` and `check:architecture`; then use Playwright CLI against real Server/Auth/PostgreSQL/Inngest/Documenso to prove client and exact collaborator flows, tabs/keyboard/focus, 390×844, desktop, 200% zoom, themes, object-URL cleanup, all-read gating, one provider transition, zero unexpected console/HTTP failures and fresh screenshots for every affected reference/state.

### F8 — Integrated documentation, generated artifacts and quality gate

#### F8-T1 — Integrate shared changes and establish the evidence baseline

- **Status/owner:** `completed` — `orchestrator` (PATH-03 and local package gates current; publication/CI remains the delivery gate)
- **Depends/parallel:** Depends on F10–F13 integrated diffs; runs no competing Builder; Reviewer starts only after this phase verifies the candidate and the structural path gate is current and passing.
- **Paths:** `apps/web/src/routeTree.gen.ts`, `documentation/architecture.md`, `documentation/infrastructure.md`, `documentation/modules.md`, `.env.example`, `apps/server/.env.example`, `apps/web/.env.example`, root/config paths in the Spec, and integrated changes from F1–F7.
- **Contract:** RF-01–RF-38 and CA-01–CA-22; MV-01–MV-08; G-01, G-02, G-04, G-05 and G-06; preserve the revision-10 one-envelope-per-request, atomic provider-entry/submission/observation, receipt claim-generation/receipt-only completion, transaction-owned aggregate derivation and provider-neutral normalization decisions and the sole active SDD boundary.
- **Outcome:** The integrated candidate has current generated route/migration metadata, aligned architecture/configuration docs, stable local services/fixtures/accounts, a passing structural path gate and a living evaluation baseline. The exact Jira/RFC delta is prepared under G-06; external mutation still requires explicit user authorization.
- **Rules:** `documentation/tooling.md`; `documentation/rules/web-app-routing-rules.md` (`Antipatterns to Avoid`); `documentation/rules/database-layer-rules.md` (`Antipatterns to Avoid`); `documentation/rules/code-conventions-rules.md` (`Antipatterns to Avoid`); `documentation/sdd.md`.
- **Exit:** Generate and review the revision-10 forward migration, run `pnpm check:spec-implementation -- documentation/features/formalization/signing-gateway/spec.md --base origin/develop --json`, then run all Spec quality commands and local full-stack checks; verify Docker/Auth/Inngest health and stable Nest/Web sessions before browser evidence; run MV-01–MV-06 locally, schedule MV-07/MV-08 behind their gates, prepare G-06 authority edits, inspect generated artifacts, and record console/HTTP/failed-request/trace/screenshot evidence and classifications in `evaluation.md`.

### F9 — Integrated read-only implementation review

#### F9-T1 — Review the complete candidate and close verified findings

- **Status/owner:** `waived` — explicit user decision recorded at EV-235; no reviewer pass is claimed
- **Depends/parallel:** Starts only after F8 integrated verification; exactly one Reviewer audits all Builder boundaries and remains the same Reviewer for any correction.
- **Paths:** Complete integrated candidate, all Core/Validation/Server/Web/shared/generated paths in the Spec, every supplied design reference and every MV evidence target.
- **Contract:** Full RF-01–RF-38, CA-01–CA-22, MV-01–MV-08 and G-01–G-06 conformance; cross-Builder contracts, security/privacy, persistence, REST, jobs, route/widget tree and documentation alignment.
- **Outcome:** The read-only Reviewer reports concrete findings without editing or deciding official evidence; the Orchestrator verifies each finding, records accepted findings in `evaluation.md`, resumes the responsible Builder when needed and preserves the exact revision-10 contract.
- **Rules:** `documentation/agents/implementation-reviewer-agent.md`; `documentation/sdd.md`; `documentation/rules/code-conventions-rules.md` (`Antipatterns to Avoid`); all affected Rule Pack paths above remain in force.
- **Exit:** Reviewer completes the integrated audit, all verified findings are resolved and rechecked, all affected sensors/evidence are rerun, no blocking finding remains, and the Orchestrator routes directly to `conclude-spec`.

## Validation and handoff

### Required manual, runtime and release coverage

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated/runtime | MV-01 — local automated lifecycle, races and persistence | CA-01–CA-22 | Spec MV-01 and quality commands | `./evaluation.md` with command output and database evidence | `waived` |
| Runtime | MV-02 — local full stack client flow | CA-01–CA-14, CA-17–CA-20 | Spec MV-02 | `./evaluation.md` plus transient trace/screenshots and real request/response/persistence evidence | `waived` |
| Runtime | MV-03 — local real Auth collaborator flow | CA-04, CA-06, CA-15 | Spec MV-03 | `./evaluation.md` plus authenticated Playwright trace, screenshot, console and failed-request classification | `waived` |
| Runtime | MV-04 — failure and recovery | CA-09–CA-14, CA-21 | Spec MV-04 | `./evaluation.md` with controlled outage, retry, revocation, no-duplicate and reconciliation evidence | `waived` |
| Security | MV-05 — token-boundary canary | CA-01, CA-02, CA-09, CA-14–CA-15 | Spec MV-05 | `./evaluation.md` with zero-match scan across URL/DOM/network/storage/cookies/console/trace/screenshots/logs | `waived` |
| Visual/accessibility | MV-06 — keyboard, screen reader smoke, responsive, zoom, themes and motion | CA-15, CA-22 | Spec MV-06 and design manifest | `./evaluation.md` with Playwright CLI screenshots, focus/live-region and console/request evidence | `waived` |
| Release/runtime | MV-07 — staging Resend, provider privacy, X.509 and pinned runtime | CA-08, CA-10–CA-14, CA-16, CA-20 | Spec MV-07; G-01/G-02/G-04/G-05 | `./evaluation.md` with transient staging artifact identifiers and gate sign-offs | `waived` |
| Security/operations | MV-08 — AGPL, scans, drift, alerts and redacted operations | CA-14, CA-16 | Spec MV-08; G-01/G-02/G-04/G-05 | `./evaluation.md` with security review, scan, alert and runbook evidence | `waived` |
| Documentation gate | G-06 — Jira/RFC authority alignment | Direct revision-6 decision | Spec G-06 | `./evaluation.md` with prepared delta, explicit user authorization, applied external updates and reread evidence | `waived` |

### Visual reference coverage

Each row requires an independent comparison and fresh Playwright CLI capture at the exact viewport in the manifest; no one capture satisfies multiple rows. Internal references use source desktop plus `390×844`; external Gateway references use `1200×900` plus `390×844`. Every affected UI exit also includes the exact Spec widget tree comparison, keyboard/narrow viewport checks, console/failed-request inspection and screenshot evidence.

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Visual | Internal configuration baseline | CA-17, CA-22 | `./design/qOfh6.png` | `./evaluation.md` — source desktop and 390×844 captures | `waived` |
| Visual | Ready-to-send action card | CA-17, CA-22 | `./design/YWfhi.png` | `./evaluation.md` — source desktop and 390×844 captures | `waived` |
| Visual | Add-signatory regression | CA-17 | `./design/sxENj.png` | `./evaluation.md` — source desktop and 390×844 captures | `waived` |
| Visual | Candidate selection regression | CA-17 | `./design/Vx43H.png` | `./evaluation.md` — source desktop and 390×844 captures | `waived` |
| Visual | Signature-field positioning regression | CA-17, CA-19 | `./design/HcT8k.png` | `./evaluation.md` — source desktop and 390×844 captures | `waived` |
| Visual | Review/confirm dialog | CA-17–CA-20 | `./design/nI1B0.png` | `./evaluation.md` — source desktop and 390×844 captures | `waived` |
| Visual | Provisioning/delivery/partial failure | CA-18–CA-22 | `./design/MC4E2.png` | `./evaluation.md` — source desktop and 390×844 captures | `waived` |
| Visual | Cancel-all dialog | CA-21–CA-22 | `./design/NSYug.png` | `./evaluation.md` — source desktop and 390×844 captures | `waived` |
| Visual | Invitation access | CA-01, CA-15 | `./design/01-access-invitation.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Channel confirmation | CA-02, CA-15 | `./design/02-select-channel.png` | `./evaluation.md` — 1200×900 and 390×844 captures; email-only revision-5 structure | `waived` |
| Visual | OTP verification | CA-03, CA-15 | `./design/03-verify-otp.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Private document reading | CA-04, CA-06–CA-07, CA-15 | `./design/04-read-document.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Multi-document tabs, per-document acknowledgement and all-read gate | CA-06–CA-08, CA-15 | Revision-6 amendment of `./design/04-read-document.png` and `./design/05-confirm-signature.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Submitted/reconciliation | CA-09–CA-10, CA-15 | `./design/06-signature-submitted.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Confirmed result | CA-11–CA-13, CA-15 | `./design/07-signature-confirmed.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Scope decision | Internal tracking excluded | — | `./design/08-internal-tracking-out-of-scope.png` | `./evaluation.md` — manifest exclusion retained; no implementation capture | `completed` |
| Visual | Collaborator document reading | CA-04, CA-06, CA-15 | `./design/09-collaborator-read.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Collaborator acknowledgement | CA-06–CA-07, CA-15 | `./design/10-collaborator-confirm.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Generic unavailable state | CA-15 | `./design/11-access-unavailable.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | No authorized email channel | CA-02, CA-15 | `./design/12-no-authorized-channel.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Invalid/expired OTP | CA-03, CA-15 | `./design/13-otp-invalid-expired.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | OTP attempt lock | CA-03, CA-15 | `./design/14-otp-attempt-limit.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Private PDF temporarily unavailable | CA-07, CA-15 | Manifest derived state from `./design/11-access-unavailable.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Signing provider temporarily unavailable | CA-08, CA-15 | Manifest derived state from `./design/11-access-unavailable.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Recipient rejected | CA-13, CA-15 | Manifest derived state from `./design/11-access-unavailable.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Request/recipient cancelled | CA-13, CA-15, CA-21 | Manifest derived state from `./design/11-access-unavailable.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Invitation/session/result expired | CA-01, CA-03, CA-09, CA-15 | Manifest derived state from `./design/11-access-unavailable.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Collaborator inactive/ineligible/unassigned | CA-04, CA-06, CA-15 | Manifest derived state from `./design/11-access-unavailable.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |
| Visual | Confirmation reconciliation required | CA-10–CA-13, CA-15 | Manifest derived state from `./design/11-access-unavailable.png` | `./evaluation.md` — 1200×900 and 390×844 captures | `waived` |

### Handoff

Under the explicit revision-12 accepted-risk decision and revision-13 worktree aggregation, MV-01–MV-08, remaining visual comparisons, G-01/G-02/G-05/G-06, FND-047/FND-049/FND-050/FND-052 and the reviewer are non-blocking and must remain labelled `waived` or `accepted risk`, never `passed`. Handoff is ready after the repository structural path gate is current and passing and F8 is completed. Publication still requires explicit authority, atomic commits, pull-request creation/update and green PR CI through [`conclude-spec`](../../../../.codex/skills/conclude-spec/SKILL.md).
