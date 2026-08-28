---
title: Configuração de assinaturas da Formalização — implementation plan
status: in_progress
spec: ./spec.md
spec_revision: 15
evaluation: ./evaluation.md
jira_tickets:
  - SCRUM-140
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/24051713
updated_at: 2026-08-28
---

## Execution status

- **Spec:** [`spec.md`](./spec.md), revision `15`, status `in_progress`.
- **Plan rationale:** The delivery crosses Core, Validation, Server persistence/providers/jobs/REST, Web UI, durable migration and private Gotenberg runtime boundaries, with dependent contracts, asynchronous recovery, and complex authenticated browser validation.
- **Current phase:** `F9` — Final readiness and handoff (`in_progress`).
- **Next action:** Run the final conformance and publication gate for the narrowed revision-15 Contract; visual captures remain transient and are not stored as feature artifacts.
- **Active blockers:** None for Plan creation. The Atlassian HMS MCP read was unavailable with a `405` WAF response; the Spec retains the canonical PRD/Jira URLs and confirmed authority alignment, and no external authority mutation is planned.
- **Builders:** F2 `builder_validation`, F3 `builder_server`, and F4 resumed `builder_core` completed and passed Orchestrator verification. F5 `builder_server` and its real migration-backed regression are complete. The same `builder_web` identity completed F6 and its available F7 scope; the Orchestrator completed the remaining F7 UI pieces after the Builder became unresponsive. Root/generated paths remain Orchestrator-owned.
- **Shared ownership:** The Orchestrator owns `docker-compose.yaml`, `apps/server/src/app.module.ts`, generated Drizzle migration artifacts, package installation/lockfile updates, and final integrated authority/conformance checks. Existing authority-document changes are preserved and are not reassigned to Builders.

## Execution ledger

## Delivery PR set

The delivery is partitioned by dependency and ownership so every PR remains at or below the
repository's 5,000 added-TypeScript-line limit. Merge in this order; each dependent PR uses
the preceding slice branch as its base.

| Order | PR | Base | Head | Scope |
| --- | --- | --- | --- | --- |
| 1 | [#97](https://github.com/hms-society/hms/pull/97) | `develop` | `codex/formalization-core-slice` | Core contracts and use cases |
| 2 | [#98](https://github.com/hms-society/hms/pull/98) | `codex/formalization-core-slice` | `codex/formalization-validation-slice` | Validation schemas and policy |
| 3 | [#99](https://github.com/hms-society/hms/pull/99) | `codex/formalization-validation-slice` | `codex/formalization-server-foundation-slice` | Server persistence and provider foundation |
| 4 | [#100](https://github.com/hms-society/hms/pull/100) | `codex/formalization-server-foundation-slice` | `codex/formalization-server-app-slice` | Server REST, jobs and composition |
| 5 | [#101](https://github.com/hms-society/hms/pull/101) | `codex/formalization-server-app-slice` | `codex/formalization-web-foundation-slice` | Web REST, routes and shared UI |
| 6 | [#102](https://github.com/hms-society/hms/pull/102) | `codex/formalization-web-foundation-slice` | `codex/formalization-web-page-slice` | Formalization page and shared hooks |
| 7 | [#103](https://github.com/hms-society/hms/pull/103) | `codex/formalization-web-page-slice` | `codex/formalization-sending-configuration-slice` | Dedicated sending-configuration UI and SDD records |

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `builder_core` | F1 | Core contracts and ports | — | — | `completed` | Core exports, contracts and canonical structures pass type/lint checks. |
| 2 | `builder_validation` | F2 | Shared validation and event schemas | F1 | F3, F4 | `completed` | Validation lint/type-check pass and transport schemas reject non-contract payloads; behavior tests live at consuming boundaries. |
| 2 | `builder_server` | F3 | Persistence and provider foundation | F1 | F2, F4 | `completed` | Storage/provider/database foundation passes focused server checks and preserves ownership boundaries. |
| 2 | `builder_core` | F4 | Core behavior and use cases | F1 | F2, F3 | `completed` | Core use-case suites pass for actor CAS, preview lifecycle, reconciliation, reset and producer compensation. |
| 3 | `builder_server` | F5 | Server REST, jobs and feature composition | F2, F3, F4 | — | `completed` | Server tests, controller routes, REST examples and feature job composition pass with real persistence boundaries. |
| 4 | `builder_web` | F6 | Web REST and action/query orchestration | F2, F5 | — | `completed` | Service, key ownership and query/action orchestration pass Web checks without direct storage/converter access. |
| 5 | `builder_web`/`orchestrator` | F7 | Signature configuration UI and browser route | F6 | — | `completed` | Widget/hook checks, full Web suite and focused route test cover the assembled Spec tree, state matrix, 390px and keyboard paths; private Blob preview lifecycle is verified in code. |
| 6 | `orchestrator` | F8 | Root/runtime wiring and integrated sensors | F5, F7 | — | `completed` | Generated artifacts and root runtime wiring are reviewed; integrated static, build and focused sensors pass. |
| 7 | `reviewer` | R1 | Integrated read-only review | F8 | — | `completed` | The single Reviewer completed the full Spec/Rule/design/runtime audit with no unresolved blocking/high finding. |
| 8 | `orchestrator` | F9 | Final readiness and handoff | R1 | — | `in_progress` | In-scope authenticated, runtime and required reference evidence is current for revision 15; final conformance and publication remain before `conclude-spec`. |

The three-way parallelism in Wave 2 is justified by the completed Core contract boundary and disjoint ownership: Validation schemas, Server infrastructure, and Core use cases can advance independently while avoiding shared file paths. The same `builder_core`, `builder_server`, and `builder_web` identities are reused for their later phases and any in-Contract corrections. Task cards are intentionally more granular than phases: `F1` has 2, `F2` has 2, `F3` has 3, `F4` has 4, `F5` has 4, `F6` has 3, `F7` has 5, `F8` has 2, `R1` has 1, and `F9` has 2, for 28 tasks total. `R1` remains one task because the SDD contract requires exactly one integrated Reviewer.

## Execution log

| Date | Change recorded from subsequent session | SDD impact |
| --- | --- | --- |
| `2026-08-27` | Formalization configuration was split into an embedded `YWfhi` summary with a dedicated-page action and a protected `/formalizacoes/$formalizationId/configuracao-envio` page. | Spec revision 11; F7-T1/F7-T2 paths and outcomes reconciled. |
| `2026-08-27` | `FormalizationDocumentsSection`, `CloseWithoutContractAction`, `FormalizationDocumentReviewPage`, and the internal document-package list/row widgets were extracted or relocated to their owning widget directories with colocated hooks/tests. The obsolete document-review-dialogs barrel was removed. | F7-T1/F7-T5 implementation tree and widget-boundary evidence updated. |
| `2026-08-27` | Signatory configuration received reference-aligned tab/page refinements using the available shadcn/ui primitives and shared icons, plus collaborator avatars, skeleton candidate loading, field-progress counts/details, and a single lifted assignment-save action. Save is enabled only when every signatory has a document and at least one selected channel, including newly added signatories. | F7-T2–F7-T4 outcomes and readiness guard recorded. |
| `2026-08-27` | Channel state changed from one selected channel to independently toggleable `selectedChannels`; Core, Validation, Server and Web mappings, actions, cards and tests were updated for selecting multiple channels and deselecting one. | Spec revision 13; F4-T2 and F7-T3 exits updated. |
| `2026-08-27` | Dependency Cruiser architecture checks were added for Core, Validation, Server and Web. Cross-module/database, React Query, REST-boundary and generated-route violations were corrected; known-violation baselines were removed and all workspace checks pass. | F8-T2 and Evaluation architecture evidence updated. |
| `2026-08-28` | Local runtime and seed data were aligned to Web `5000` and Server `5555`; real DOCX seed assets were added for the approved current documents and Inngest/Gotenberg preview processing was revalidated through the authenticated CLI flow. | F8-T2/F9-T1 runtime evidence updated. |
| `2026-08-28` | Validation package tests and its test tooling were removed by policy. `@hms/validation` now exposes lint/type-check only; root `test`/`test:coverage` exclude it, while Core/Server/Web consumers own behavior coverage. Browser validation is standardized on Playwright CLI; browser-use is not part of the project workflow. | Spec revision 14; F2 exits and validation handoff updated. |
| `2026-08-28` | Full covered-workspace `pnpm test:coverage` completed successfully for Core, Server and Web after stale signatory test mocks were corrected. | F9-T1 coverage evidence added; remaining F9 manual/visual gaps stay open. |
| `2026-08-28` | The Contract was narrowed to remove supplemental cross-tenant, concurrent-conflict, changed-package, historical-DOCX and pending visual-comparison closure obligations. Reopen preservation/reset remain covered by automated tests and the real authenticated continuation. | Spec revision 15; F9 handoff and Evaluation reconciled so these removed scenarios no longer block conclusion. |
| `2026-08-28` | The latest Web work was recorded: unique-signatory field progress, Fields Editor document/tab unsaved-change prompts, focused route coverage `2/2`, focused Web coverage `16` files/`71` tests, and full Web coverage `110` files/`403` tests. | F9-T1 evidence refreshed in Evaluation `EV-22`. |

### F1 — Core contracts and ports

#### F1-T1 — Establish canonical signature domain declarations

- **Status/owner:** `completed` — `builder_core`
- **Depends/parallel:** No dependency; unlocks F2, F3 and F4. No active path overlap.
- **Paths:** `packages/core/src/formalization/domain/entities/`; `packages/core/src/formalization/domain/structures/`; `packages/core/src/formalization/domain/errors/`; `packages/core/src/formalization/domain/events/`; `packages/core/src/formalization/domain/index.ts`.
- **Contract:** `RF-03`, `RF-06`, `RF-07`, `RF-08`, `RF-10`, `RF-12`, `RF-14`–`RF-18`; `CA-02`, `CA-04`–`CA-09`; Spec §3 `packages/core — Domain`.
- **Outcome:** Canonical entities, immutable projections/events, closed state/channel unions, named errors and privacy-safe domain structures compile from one Core source; no CPF, storage path, provider framework or signing-provider contract crosses the boundary.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md); [`documentation/rules/core-package-rules.md`](../../../rules/core-package-rules.md) — “One exported type per file”, “Business rules belong to use cases”, “Enum-like domain structures are canonical”, “Contracts belong to interfaces directories”, and “Entity identity and composition”.
- **Exit:** Run `pnpm --filter @hms/core check-types` and `pnpm --filter @hms/core lint`; inspect barrels, closed unions, readonly event/projection depth, privacy exclusions and the prohibited-scope list.

#### F1-T2 — Establish Core ports and shared storage contracts

- **Status/owner:** `completed` — `builder_core`
- **Depends/parallel:** Depends on F1-T1; no parallel task in `builder_core`; unlocks F2, F3 and F4.
- **Paths:** `packages/core/src/formalization/interfaces/`; `packages/core/src/formalization/index.ts`; `packages/core/src/shared/domain/structures/stored-file-content.ts`; `packages/core/src/shared/domain/structures/index.ts`; `packages/core/src/shared/interfaces/file-storage-provider.ts`; `packages/core/src/shared/interfaces/storage-provider.ts`; `packages/core/src/shared/interfaces/stored-files-repository.ts`; `packages/core/src/shared/interfaces/index.ts`; `packages/core/src/identity/interfaces/collaborators-repository.ts`.
- **Contract:** `RF-01`–`RF-18`; `CA-01`–`CA-10`; Spec §3 `packages/core — Use cases and Interfaces`.
- **Outcome:** Service, repository, source-reader, transaction, PDF conversion/inspection, CAS/lease, identity collaborator and shared durable-file ports are exported from the correct module boundaries with no infrastructure types or content-bearing event contracts.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md); [`documentation/rules/core-package-rules.md`](../../../rules/core-package-rules.md) — “Contracts belong to interfaces directories”, “Core does not import infrastructure”, “Shared references are minimal”, and “Entity identity and composition”.
- **Exit:** Run `pnpm --filter @hms/core check-types` and `pnpm --filter @hms/core lint`; inspect every public barrel and verify ports expose primitive persistence/lease operations without moving lifecycle, reconciliation, provider or authorization decisions into adapters.

### F2 — Shared validation and event schemas

#### F2-T1 — Define HTTP and transport boundary validation

- **Status/owner:** `completed` — `builder_validation`
- **Depends/parallel:** Depends on F1 canonical structures; runs parallel with F3 and F4 on disjoint `packages/validation` paths.
- **Paths:** `packages/validation/src/formalization/formalization-signature-configuration-schema.ts`; `packages/validation/src/formalization/index.ts`.
- **Contract:** `RF-04`, `RF-08`, `RF-10`, `RF-11`, `RF-18`; `CA-03`, `CA-05`, `CA-06`, `CA-09`; Spec §3 `packages/validation` configuration schema.
- **Outcome:** Query, candidate, add, assignment, channel, field, preview and reset schemas enforce UUIDs, bounded pagination/arrays, canonical channels, finite normalized geometry and expected-version CAS fields while excluding CPF, bytes and provider internals.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md); [`documentation/rules/core-package-rules.md`](../../../rules/core-package-rules.md) — “Enum-like domain structures are canonical”; [`documentation/rules/validation-package-rules.md`](../../../rules/validation-package-rules.md); [`documentation/rules/messaging-layer-rules.md`](../../../rules/messaging-layer-rules.md) — “Event schemas validate transport payloads” and “Fan-out publishes individual domain events”.
- **Exit:** Run `pnpm --filter @hms/validation lint` and `pnpm --filter @hms/validation check-types`; inspect the schemas and exports for malformed identifier, extra personal/byte field, non-finite geometry, invalid channel and unbounded-payload rejection. Do not add a Validation-package test file; consuming Core/Server/Web suites own behavior coverage.

#### F2-T2 — Define identifier-only preview event schemas and exports

- **Status/owner:** `completed` — `builder_validation`
- **Depends/parallel:** Depends on F2-T1; no parallel task in `builder_validation`; remains parallel with F3 and F4.
- **Paths:** `packages/validation/src/formalization/formalization-signature-preview-batch-event-schema.ts`; `packages/validation/src/formalization/formalization-signature-preview-event-schema.ts`; `packages/validation/src/formalization/index.ts`.
- **Contract:** `RF-08`, `RF-10`, `RF-11`, `RF-18`; `CA-05`, `CA-09`, `CA-10`; Spec §3 event schemas and messaging restrictions.
- **Outcome:** Batch and individual preview events serialize only bounded unique Formalization/preview/attempt identifiers and occurrence time, are publicly exported, and reject bytes, checksums, person data, arbitrary envelopes and malformed timestamps.
- **Rules:** [`documentation/rules/messaging-layer-rules.md`](../../../rules/messaging-layer-rules.md) — “Event schemas validate transport payloads”, “Fan-out publishes individual domain events”, “Using a work reconciler as an implicit outbox”, and “Retrying leased work without an attempt identity”; [`documentation/rules/validation-package-rules.md`](../../../rules/validation-package-rules.md); [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md).
- **Exit:** Run `pnpm --filter @hms/validation lint` and `pnpm --filter @hms/validation check-types`; inspect serialized event shapes and exports, and verify event schemas contain no CPF, file bytes, checksum or parser/provider fields. Behavior and privacy assertions belong to consuming Core/Server/Web tests.

### F3 — Persistence and provider foundation

#### F3-T1 — Build shared durable-file storage adapters

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F1 ports; runs parallel with F2 and F4. Root Compose wiring and generated migrations remain Orchestrator-owned.
- **Paths:** `apps/server/src/shared/database/drizzle/models/stored-file-model.ts`; `apps/server/src/shared/database/drizzle/mappers/stored-file-mapper.ts`; `apps/server/src/shared/database/drizzle/repositories/drizzle-stored-files-repository.ts`; `apps/server/src/shared/database/drizzle/repositories/index.ts`; `apps/server/src/shared/database/drizzle/database.module.ts`; `apps/server/src/shared/database/drizzle/schema.ts`; `apps/server/src/shared/provision/constants/provision-providers.ts`; `apps/server/src/shared/provision/file-storage/`; `apps/server/src/shared/provision/storage/supabase-storage-provider.ts`; `apps/server/src/shared/provision/provision.module.ts`.
- **Contract:** `RF-08`, `RF-14`, `RF-16`, `RF-17`, `RF-18`; `CA-05`, `CA-09`, `CA-10`; Spec §3 shared Database/Provision and storage restrictions.
- **Outcome:** Durable private DOCX/PDF metadata and bytes are persisted behind `FileStorageProvider`, object paths are immutable, metadata/object partial failures compensate, and the shared provider remains free of Formalization business decisions.
- **Rules:** [`documentation/rules/database-layer-rules.md`](../../../rules/database-layer-rules.md) — “Database code belongs to the owning module”, “Mappers define the persistence boundary”, “Repositories implement core contracts”, and “Repositories do not receive tests”; [`documentation/rules/provision-layer-rules.md`](../../../rules/provision-layer-rules.md) — “Core declares the contract” and “Providers contain infrastructure concerns only”; [`documentation/rules/server-app-layer-rules.md`](../../../rules/server-app-layer-rules.md) — “Provision modules encapsulate feature adapters”.
- **Exit:** Run focused stored-file, Supabase storage/file-provider and mapper checks plus `pnpm --filter server check:types`; verify private bucket behavior, immutable paths, idempotent removal, partial-failure compensation and absence of CPF/content-bearing logs.

#### F3-T2 — Build Formalization signature persistence and confirmation transaction

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F3-T1 and F1 ports; no parallel task in `builder_server`; generated migration artifacts remain F8-T1-owned.
- **Paths:** `apps/server/src/formalization/database/drizzle/models/formalization-signature-model.ts`; `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature.ts`; `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-mapper.ts`; `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-configuration-repository.ts`; `apps/server/src/formalization/database/formalization-document-confirmation-transaction.ts`; `apps/server/src/formalization/database/formalization-database.module.ts`.
- **Contract:** `RF-03`, `RF-08`, `RF-14`, `RF-16`, `RF-17`, `RF-18`; `CA-02`, `CA-05`, `CA-08`, `CA-09`, `CA-10`; Spec Database model, repository and transaction restrictions.
- **Outcome:** Four signature tables/enums/relations, exact row mappings, tenant-qualified primitive repository operations, token/lease CAS transitions and atomic confirmation/legacy initialization reconciliation are implemented without use-case business decisions.
- **Rules:** [`documentation/rules/database-layer-rules.md`](../../../rules/database-layer-rules.md) — “Database code belongs to the owning module”, “Mappers define the persistence boundary”, “Repositories implement core contracts”, “Repositories do not receive tests”, and “Transactions are explicit”; [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md).
- **Exit:** Run focused database/repository/transaction checks and `pnpm --filter server check:types`; verify tenant scoping, expected-version conflicts, preview attempt-token/lease CAS, current-preview preservation, cleanup candidates and no direct event publication from the transaction.

#### F3-T3 — Add PDF conversion, inspection, environment and provider tokens

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F3-T2 for persistence tokens; no parallel task in `builder_server`; F8 owns Docker runtime wiring.
- **Paths:** `apps/server/src/formalization/provision/gotenberg-document-pdf-converter-provider.ts`; `apps/server/src/formalization/provision/gotenberg-document-pdf-converter-provider.test.ts`; `apps/server/src/formalization/provision/pdf-js-formalization-document-pdf-inspector-provider.ts`; `apps/server/src/formalization/provision/pdf-js-formalization-document-pdf-inspector-provider.test.ts`; `apps/server/src/formalization/provision/formalization-signature-source-reader.ts`; `apps/server/src/formalization/provision/formalization-provision.module.ts`; `apps/server/src/formalization/constants/formalization-providers.ts`; `apps/server/src/formalization/constants/index.ts`; `apps/server/src/shared/provision/env/env-provider.ts`; `apps/server/src/shared/provision/env/env-provider.test.ts`; `apps/server/package.json`.
- **Contract:** `RF-08`, `RF-18`; `CA-05`, `CA-10`; Spec Provision, source-reader, environment and dependency entries.
- **Outcome:** Gotenberg conversion, server-side PDF page inspection, metadata-only source projections, stable injection tokens and bounded private runtime configuration exist behind Core ports; external failures become typed retryable/permanent results.
- **Rules:** [`documentation/rules/provision-layer-rules.md`](../../../rules/provision-layer-rules.md) — “Core declares the contract”, “Providers contain infrastructure concerns only”, “Provider errors are typed”, and “Private runtime config stays server-side”; [`documentation/rules/server-app-layer-rules.md`](../../../rules/server-app-layer-rules.md) — “Provision modules encapsulate feature adapters”; [`documentation/infrastructure.md`](../../../infrastructure.md).
- **Exit:** Run converter/inspector/env suites and `pnpm --filter server check:types`; verify PDF signature/content-type/size/timeout classification, multipage geometry, malformed/encrypted failures, no storage access in conversion, no CPF/bytes in source projections, and no browser-exposed Gotenberg configuration.

### F4 — Core behavior and use cases

#### F4-T1 — Implement configuration read, initialization and signatory actor use cases

- **Status/owner:** `completed` — `builder_core`
- **Depends/parallel:** Depends on F1; first behavior task in this phase. F2 and F3 may run in parallel; Server and Web consume this behavior after F4.
- **Paths:** `packages/core/src/formalization/use-cases/get-formalization-signature-configuration-use-case.ts`; `packages/core/src/formalization/use-cases/list-formalization-signature-candidates-use-case.ts`; `packages/core/src/formalization/use-cases/initialize-formalization-signature-configuration-use-case.ts`; `packages/core/src/formalization/use-cases/add-formalization-signatory-use-case.ts`; `packages/core/src/formalization/use-cases/remove-formalization-signatory-use-case.ts`; their colocated tests.
- **Contract:** `RF-01`–`RF-05`, `RF-07`, `RF-13`, `RF-14`, `RF-16`; `CA-01`–`CA-04`, `CA-07`, `CA-09`, `CA-10`.
- **Outcome:** Read-only configuration, privacy-safe authoritative candidate search, idempotent legacy initialization, default signatory protection, eligibility checks, duplicate prevention and targeted cascade behavior are enforced without infrastructure dependencies.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md); [`documentation/rules/core-package-rules.md`](../../../rules/core-package-rules.md) — “Business rules belong to use cases”; [`documentation/rules/use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md) — “One test file per use case”, “Mock dependencies with vitest-mock-extended”, “Time is deterministic”, “Domain test data uses colocated fakers”, and “Unit tests stay infrastructure-free”.
- **Exit:** Run the five focused use-case suites plus `pnpm --filter @hms/core lint` and `pnpm --filter @hms/core check-types`; cover access denial, zero-write reads, legacy idempotency/concurrency, authoritative eligibility, protected defaults, duplicate handling and expected-version conflicts.

#### F4-T2 — Implement assignment, channel and field mutation use cases

- **Status/owner:** `completed` — `builder_core`
- **Depends/parallel:** Depends on F4-T1; no parallel task in `builder_core`; preserves the F2/F3 parallelism outside this phase.
- **Paths:** `packages/core/src/formalization/use-cases/replace-formalization-signatory-documents-use-case.ts`; `packages/core/src/formalization/use-cases/select-formalization-signatory-channel-use-case.ts`; `packages/core/src/formalization/use-cases/replace-formalization-signature-fields-use-case.ts`; their colocated tests.
- **Contract:** `RF-04`, `RF-05`, `RF-06`, `RF-07`, `RF-09`, `RF-12`, `RF-14`, `RF-15`; `CA-03`, `CA-04`, `CA-06`, `CA-09`.
- **Outcome:** Replace-all document assignments use current versions, channel selection independently toggles any available channel and revalidates current availability without fallback, and field updates enforce finite contained geometry, current ready preview, ownership, assignment, debounce-compatible replacement and CAS semantics.
- **Rules:** [`documentation/rules/core-package-rules.md`](../../../rules/core-package-rules.md) — “Business rules belong to use cases” and “Core does not import infrastructure”; [`documentation/rules/use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md) — “One test file per use case”, deterministic time and infrastructure-free unit tests.
- **Exit:** Run the three focused suites and Core checks; cover replace-all semantics, selecting multiple available channels, deselecting one channel, unavailable channel rejection, stale preview/assignment rejection, non-finite/out-of-bounds geometry, authorization, version conflicts and no fallback behavior.

#### F4-T3 — Implement preview generation, recovery and private content use cases

- **Status/owner:** `completed` — `builder_core`
- **Depends/parallel:** Depends on F4-T2 and the F1 ports; no parallel task in `builder_core`.
- **Paths:** `packages/core/src/formalization/use-cases/request-formalization-signature-preview-generation-use-case.ts`; `packages/core/src/formalization/use-cases/process-formalization-signature-preview-use-case.ts`; `packages/core/src/formalization/use-cases/fail-formalization-signature-preview-use-case.ts`; `packages/core/src/formalization/use-cases/reconcile-formalization-signature-previews-use-case.ts`; `packages/core/src/formalization/use-cases/get-formalization-signature-preview-content-use-case.ts`; their colocated tests.
- **Contract:** `RF-08`, `RF-10`, `RF-11`, `RF-12`, `RF-14`, `RF-15`, `RF-17`, `RF-18`; `CA-05`, `CA-07`, `CA-09`, `CA-10`.
- **Outcome:** Preview retries, token/lease processing, DOCX load, conversion, PDF storage/inspection, safe terminal failure, bounded reconciliation, cleanup and authorized private content access are idempotent and stale-attempt safe.
- **Rules:** [`documentation/rules/core-package-rules.md`](../../../rules/core-package-rules.md) — “Business rules belong to use cases”; [`documentation/rules/use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md) — deterministic time, one test file per use case and infrastructure-free unit tests; [`documentation/rules/messaging-layer-rules.md`](../../../rules/messaging-layer-rules.md) — “Retrying leased work without an attempt identity”.
- **Exit:** Run the five focused suites and Core checks; cover failed→pending retry publication, claim/finalize/fail CAS, stale-token no-op, converter/inspection failures, compensation, bounded recovery, cleanup idempotency, ownership recheck and safe file return.

#### F4-T4 — Implement reset/reopen/confirm behavior and producer compensation

- **Status/owner:** `completed` — `builder_core`
- **Depends/parallel:** Depends on F4-T3; final sequential task in `builder_core`.
- **Paths:** `packages/core/src/formalization/use-cases/reset-formalization-signature-configuration-use-case.ts`; `packages/core/src/formalization/use-cases/reopen-formalization-document-package-use-case.ts`; `packages/core/src/formalization/use-cases/confirm-formalization-documents-use-case.ts`; `packages/core/src/formalization/use-cases/index.ts`; their tests; `packages/core/src/document-production/use-cases/save-generated-document-version-use-case.ts` and test; `packages/core/src/formalization/use-cases/save-manual-formalization-document-version-use-case.ts` and test; `packages/core/src/consultation/use-cases/save-manual-consultation-document-version-use-case.ts` and test.
- **Contract:** `RF-02`, `RF-03`, `RF-07`, `RF-08`, `RF-13`–`RF-18`; `CA-01`, `CA-02`, `CA-05`, `CA-07`–`CA-10`.
- **Outcome:** Reset atomically restores defaults and cleanup candidates, reopen immediately locks/preserves configuration while clearing confirmation fields, confirm performs approved/current preview reconciliation and one post-commit event, and all three durable-version producers compensate failed inserts.
- **Rules:** [`documentation/rules/core-package-rules.md`](../../../rules/core-package-rules.md) — “Business rules belong to use cases”, “Core does not import infrastructure”, and “Shared references are minimal”; [`documentation/rules/use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md) — dependency assertions, deterministic time and one test file per use case.
- **Exit:** Run the reset/reopen/confirm and three producer suites plus all Core checks; verify atomicity, default initialization, approved/fresh selected versions, current-preview preservation, one batch event after commit, immutable successful file IDs and removal of new durable files on version insert failure.

### F5 — Server REST, jobs and feature composition

#### F5-T1 — Expose read and candidate REST actions

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F2, F3 and F4; first Server REST task. No parallel implementation task in `builder_server`.
- **Paths:** `apps/server/src/formalization/rest/controllers/get-formalization-signature-configuration.controller.ts`; `initialize-formalization-signature-configuration.controller.ts`; `list-formalization-signature-candidates.controller.ts`; their exact colocated tests under `apps/server/src/formalization/rest/controllers/tests/`.
- **Contract:** `RF-01`, `RF-02`, `RF-03`, `RF-04`, `RF-13`, `RF-14`, `RF-16`; `CA-01`–`CA-04`, `CA-07`, `CA-10`; Spec Server REST table.
- **Outcome:** Authenticated GET configuration, explicit idempotent POST initialization and privacy-safe paginated candidate search dispatch through application use cases with documented statuses and no accidental writes on reads.
- **Rules:** [`documentation/rules/rest-layer-rules.md`](../../../rules/rest-layer-rules.md) — “One controller represents one application action”, “Controllers document HTTP responses”, and “Services implement REST contracts”; [`documentation/rules/controllers-testing-rules.md`](../../../rules/controllers-testing-rules.md) — “Controller tests are integration tests”, “Use real infrastructure and minimize mocks”, and “Assert the HTTP and persistence contracts”.
- **Exit:** Run the three focused controller suites and server type/code checks; verify real request/response, auth/status mapping, persistence for initialization, tenant scoping, pagination-before-filter behavior and privacy-safe candidate responses. Mocks may cover only the approved external converter boundary.

#### F5-T2 — Expose mutation, preview, package and REST-client actions

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F5-T1; no parallel task in `builder_server`.
- **Paths:** `apps/server/src/formalization/rest/controllers/add-formalization-signatory.controller.ts`; `remove-formalization-signatory.controller.ts`; `replace-formalization-signatory-documents.controller.ts`; `select-formalization-signatory-channel.controller.ts`; `request-formalization-signature-preview-generation.controller.ts`; `get-formalization-signature-preview-content.controller.ts`; `replace-formalization-signature-fields.controller.ts`; `reset-formalization-signature-configuration.controller.ts`; `reopen-formalization-document-package.controller.ts`; `confirm-formalization-documents.controller.ts`; `apps/server/src/formalization/rest/controllers/index.ts`; all matching controller tests; `apps/server/rest-client/formalization/formalizations.rest`.
- **Contract:** `RF-04`–`RF-08`, `RF-12`–`RF-18`; `CA-03`–`CA-10`; Spec Server REST and REST-client inventory.
- **Outcome:** Assignment/channel/field/reset/retry/reopen/confirm actions and private PDF streaming expose validated CAS-aware status contracts, while the `.rest` file inventories every signature-configuration route with reusable IDs, auth, query/body examples and representative conflict geometry.
- **Rules:** [`documentation/rules/rest-layer-rules.md`](../../../rules/rest-layer-rules.md) — “One controller represents one application action”, “Controllers document HTTP responses”, “Every route group has a REST client file”, and “Services implement REST contracts”; [`documentation/rules/controllers-testing-rules.md`](../../../rules/controllers-testing-rules.md) — HTTP/persistence contract assertions and real infrastructure; [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md).
- **Exit:** Run all mutation/streaming/confirm controller suites, REST route inventory checks and server checks; verify real authorized request/response and persistence/authorization behavior, PDF `StreamableFile` headers/private cache policy, 409 recovery contract, after-commit publication boundaries and no content-bearing logs. Mocks may cover only the converter boundary.

#### F5-T3 — Implement preview fan-out, worker and reconciliation jobs

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F5-T2 and F2 event schemas; no parallel task in `builder_server`.
- **Paths:** `apps/server/src/formalization/messaging/inngest/jobs/generate-formalization-signature-previews-in-batch-job.ts`; its test; `generate-formalization-signature-preview-job.ts`; its test; `reconcile-formalization-signature-previews-job.ts`; its test; `apps/server/src/formalization/messaging/inngest/jobs/index.ts`; `apps/server/src/formalization/messaging/formalization-messaging.module.ts`.
- **Contract:** `RF-08`, `RF-10`, `RF-11`, `RF-12`, `RF-17`, `RF-18`; `CA-05`, `CA-07`, `CA-09`, `CA-10`; Spec Messaging table.
- **Outcome:** Batch events fan out to identifier-only individual events, the worker claims/processes/fails one attempt with bounded retry/concurrency/timeout, and the scheduled reconciler recovers pending/expired/cleanup work without duplicate unsafe finalization.
- **Rules:** [`documentation/rules/messaging-layer-rules.md`](../../../rules/messaging-layer-rules.md) — “Jobs expose `this.function`”, “Event schemas validate transport payloads”, “Fan-out publishes individual domain events”, “Using a work reconciler as an implicit outbox”, and “Retrying leased work without an attempt identity”; [`documentation/rules/server-app-layer-rules.md`](../../../rules/server-app-layer-rules.md) — “Messaging modules own jobs and messaging dependencies”.
- **Exit:** Run all focused job suites and server checks; verify exact child event arrays, sibling independence, schema rejection, lease/token CAS, terminal failure with current token, bounded reconciliation, idempotent cleanup, scheduled registration and no duplicate Inngest function ownership. Mocks are limited to external boundaries.

#### F5-T4 — Complete feature composition and durable-version tool wiring

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** Depends on F5-T3; final sequential task in `builder_server`; root `app.module.ts` and Docker remain F8-owned.
- **Paths:** `apps/server/src/formalization/formalization-application.service.ts`; `apps/server/src/formalization/formalization.module.ts`; `apps/server/src/formalization/fixtures/formalization-module-fixture.ts`; `apps/server/src/shared/provision/provision.module.ts`; `apps/server/src/document-production/ai/mastra/tools/save-generated-document-version-tool.ts`; its test; `apps/server/src/shared/provision/env/env-provider.ts`; `apps/server/src/shared/provision/env/env-provider.test.ts`; `apps/server/.env.example`.
- **Contract:** `RF-08`, `RF-13`, `RF-14`, `RF-17`, `RF-18`; `CA-01`, `CA-02`, `CA-05`, `CA-07`, `CA-10`; Spec Composition, fixture, environment and AI-tool entries.
- **Outcome:** REST application composition constructs only actor/query actions, feature modules bind database/provision/messaging dependencies without circular ownership, fixtures override deterministic boundaries, shared production bindings use durable storage and the version tool preserves compensation/errors.
- **Rules:** [`documentation/rules/server-app-layer-rules.md`](../../../rules/server-app-layer-rules.md) — “Technical layer directories own Nest modules”, “Provision modules encapsulate feature adapters”, and “Messaging modules own jobs and messaging dependencies”; [`documentation/rules/provision-layer-rules.md`](../../../rules/provision-layer-rules.md); [`documentation/rules/controllers-testing-rules.md`](../../../rules/controllers-testing-rules.md).
- **Exit:** Run focused composition/fixture/tool/env checks plus `pnpm --filter server check:code`, `check:types` and `build`; bootstrap the feature with real module composition, verify explicit fake overrides, durable save compensation, validated env defaults and no circular messaging import. Do not use REST fixtures as evidence of full application bootstrap.

### F6 — Web REST and action/query orchestration

#### F6-T1 — Implement the typed Formalization REST adapter

- **Status/owner:** `completed` — `builder_web`
- **Depends/parallel:** Depends on F2 schemas and F5 routes; first Web task and disjoint from the hook paths below.
- **Paths:** `apps/web/src/rest/services/formalization-service.ts`; `apps/web/src/rest/services/tests/formalization-service.test.ts`.
- **Contract:** `RF-01`, `RF-02`, `RF-04`, `RF-05`, `RF-07`, `RF-08`, `RF-13`–`RF-18`; `CA-01`, `CA-03`, `CA-04`, `CA-05`, `CA-07`–`CA-10`; Spec Web REST table.
- **Outcome:** Typed service methods map every signature configuration, candidate, retry, content, reset, reopen and confirmation operation with the repository’s REST factory, status constants, session headers and private PDF file response contract.
- **Rules:** [`documentation/rules/rest-layer-rules.md`](../../../rules/rest-layer-rules.md) — “Services implement REST contracts” and “Web REST transport owns session headers”; [`documentation/rules/ui-layer-rules.md`](../../../rules/ui-layer-rules.md) — “REST adapters are factories” and “Use shared HTTP status constants”; [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md).
- **Exit:** Run the focused REST-adapter suite plus `pnpm --filter web test`, `check:code` and `check:types`; verify every method/path/query/body/result/error mapping, PDF MIME validation, private response handling, auth headers and no browser Storage/Gotenberg access.

#### F6-T2 — Move detail/signature resources to owning query and action hooks

- **Status/owner:** `completed` — `builder_web`
- **Depends/parallel:** Depends on F6-T1; no parallel task in `builder_web`; prepares F7 widget behavior.
- **Paths:** deleted `apps/web/src/ui/formalization/hooks/formalization-query-keys.ts`; `apps/web/src/ui/formalization/hooks/use-formalization-query.ts`; `apps/web/src/ui/formalization/hooks/use-save-formalization-contract-form-action.ts`; `apps/web/src/ui/formalization/hooks/use-formalization-signature-configuration.ts` and its owning action/query hooks.
- **Contract:** `RF-01`, `RF-02`, `RF-04`, `RF-07`, `RF-08`, `RF-13`, `RF-14`, `RF-16`, `RF-18`; `CA-01`, `CA-02`, `CA-03`, `CA-05`, `CA-07`, `CA-09`, `CA-10`.
- **Outcome:** The query-key registry is deleted, detail/configuration/candidate/preview-content key builders live beside their owning hooks, initialization is explicit and exactly-once for `initialization_required`, preparation polling is bounded, returned projections prime cache and conflicts recover through reload/invalidation. The Web architecture check enforces the approved React Query and REST boundaries.
- **Rules:** [`documentation/rules/ui-layer-rules.md`](../../../rules/ui-layer-rules.md) — “Action hooks”, “Creating query-key registries”, “Query hooks must also hide TanStack Query’s generic result names”, “Mixing widget behavior with action/query hooks”, and “REST adapters are factories”; [`documentation/rules/rest-layer-rules.md`](../../../rules/rest-layer-rules.md).
- **Exit:** Run hook/service tests plus Web checks; inspect imports to prove no registry/`queries/` pattern remains, test cache ownership/invalidation/prime/conflict behavior, and verify the exact Spec widget-tree states, keyboard/narrow-viewport behavior, fresh screenshots for affected states, console/hydration warnings and failed requests. Record evidence in `evaluation.md`.

#### F6-T3 — Implement document workflow, version and page orchestration hooks

- **Status/owner:** `completed` — `builder_web`
- **Depends/parallel:** Depends on F6-T2; final sequential task in `builder_web` before F7 UI components.
- **Paths:** `apps/web/src/ui/formalization/hooks/use-formalization-document-production.ts`; `apps/web/src/ui/formalization/hooks/use-formalization-document-version-query.ts`; `apps/web/src/ui/formalization/widgets/pages/formalization-page/use-formalization-page.ts`; `apps/web/src/ui/formalization/widgets/pages/formalization-document-review-page/use-formalization-document-review-page.ts`.
- **Contract:** `RF-02`, `RF-05`, `RF-07`, `RF-08`, `RF-13`, `RF-14`, `RF-16`, `RF-17`; `CA-01`, `CA-05`, `CA-07`, `CA-08`, `CA-10`.
- **Outcome:** Document/version query keys are locally owned, confirm/reopen actions invalidate or prime detail/selection/document/configuration resources, and page hooks remain composition-only while delegating all server behavior to action/query hooks.
- **Rules:** [`documentation/rules/ui-layer-rules.md`](../../../rules/ui-layer-rules.md) — “Mixing widget behavior with action/query hooks”, “Query hooks must also hide TanStack Query’s generic result names”, “Action hooks”, and “Widgets expose widget-specific prop types”; [`documentation/rules/rest-layer-rules.md`](../../../rules/rest-layer-rules.md).
- **Exit:** Run focused hook tests and Web checks; verify confirmation/reopen invalidation, stale preview handling, no direct REST/storage/converter access in page hooks, exact widget-tree composition, keyboard and 390px behavior, fresh Playwright screenshots for affected states, and clean console/hydration/failed-request evidence. Record evidence in `evaluation.md`.

### F7 — Signature configuration UI and browser route

#### F7-T1 — Compose the page and document-package surfaces

- **Status/owner:** `completed` — `builder_web`
- **Depends/parallel:** Depends on F6; first UI composition task. No parallel implementation task because `builder_web` owns the feature UI.
- **Paths:** `apps/web/src/ui/formalization/widgets/pages/formalization-page/index.tsx`; `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-documents-section/`; `apps/web/src/ui/formalization/widgets/pages/formalization-page/close-without-contract-action/`; `apps/web/src/ui/formalization/widgets/pages/formalization-document-review-page/`; `apps/web/src/ui/document-production/widgets/components/document-package/document-package-list/`; `apps/web/src/ui/document-production/widgets/components/document-package/document-package-row/`; `apps/web/src/ui/document-production/widgets/components/document-package/tests/`; `apps/web/src/ui/formalization/widgets/pages/formalization-page/tests/` page composition tests.
- **Contract:** `RF-02`, `RF-07`, `RF-13`, `RF-14`, `RF-16`; `CA-01`, `CA-07`, `CA-08`, `CA-10`; Design Contract nodes `YWfhi` and package/reopen states.
- **Outcome:** `FormalizationPage` composes the extracted document-package/close-action widgets and the `YWfhi` summary with the Spec’s hierarchy, package reopen affordance, confirmed-state controls, disabled send handoff and semantic tokens without owning child behavior. The detailed configuration is reached through the protected dedicated page.
- **Rules:** [`documentation/rules/ui-layer-rules.md`](../../../rules/ui-layer-rules.md) — “Mirror widget structure for nested components”, “Visual implementation follows the design system”, and “Widgets expose widget-specific prop types”; [`documentation/rules/widget-testing-rules.md`](../../../rules/widget-testing-rules.md) — “Separate widget tests from hook tests”, “Minimum behavior matrix for stateful widgets”, and “Navigation has unit and integration boundaries”; [`documentation/design.md`](../../../design.md).
- **Exit:** Run focused package/page tests and Web checks; compare the exact page widget tree and `YWfhi` ready/preparation states, exercise keyboard and 390×844 reflow, capture fresh screenshots, and inspect focus order, overflow, console errors, hydration warnings and failed requests. Record evidence in `evaluation.md`.

#### F7-T2 — Implement the root signature-configuration card

- **Status/owner:** `completed` — `builder_web`
- **Depends/parallel:** Depends on F7-T1 and F6-T2; no parallel task in `builder_web`.
- **Paths:** `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/index.tsx`; `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/use-formalization-sending-configuration.ts`; their component/hook tests.
- **Contract:** `RF-02`, `RF-04`, `RF-05`, `RF-07`, `RF-08`, `RF-13`, `RF-14`, `RF-16`; `CA-01`, `CA-02`, `CA-03`, `CA-05`, `CA-07`, `CA-09`, `CA-10`; Design node `YWfhi`.
- **Outcome:** The dedicated page/panel and embedded summary preserve the root card hierarchy, tab states, preparation progress, readiness/disabled send, initialization-required, reset, conflict and access/error states through colocated behavior and semantic design tokens. The assignment save action is centralized and guarded until every signatory has a document and at least one channel.
- **Rules:** [`documentation/rules/ui-layer-rules.md`](../../../rules/ui-layer-rules.md) — “Keep UI logic inside the owning widget hook”, “Visual implementation follows the design system”, “Use shared HTTP status constants”, and “Widgets expose widget-specific prop types”; [`documentation/rules/widget-testing-rules.md`](../../../rules/widget-testing-rules.md) — widget/hook separation and minimum state matrix; [`documentation/design.md`](../../../design.md).
- **Exit:** Run component/hook tests and Web checks; compare `YWfhi` ready and `preparing_configuration`, initialization-required, forbidden, unsaved/conflict and dark-mode states to the Spec, validate keyboard/narrow reflow, capture fresh screenshots, and inspect console/hydration/failed-request evidence in `evaluation.md`.

#### F7-T3 — Implement signatory tab, cards and candidate dialog

- **Status/owner:** `completed` — `orchestrator` (continuing `builder_web` implementation)
- **Depends/parallel:** Depends on F7-T2; no parallel task in `builder_web`.
- **Paths:** `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/`; its component and hook tests, including `signatory-card/` and `candidate-dialog/`.
- **Contract:** `RF-03`, `RF-04`, `RF-05`, `RF-07`, `RF-14`, `RF-16`; `CA-03`, `CA-04`, `CA-07`, `CA-09`, `CA-10`; Design nodes `sxENj` and `Vx43H`.
- **Outcome:** Signatories, explicit document assignments, independently toggleable channel availability, default-role protection, add/search/pagination/loading/empty/error recovery, shared collaborator avatars/skeleton loading and delegated mutations match the widget tree and privacy-safe projection contract. Newly added signatories participate in the same readiness/save guard.
- **Rules:** [`documentation/rules/ui-layer-rules.md`](../../../rules/ui-layer-rules.md) — “Mirror widget structure for nested components”, “Keep UI logic inside the owning widget hook”, and “Widgets expose widget-specific prop types”; [`documentation/rules/widget-testing-rules.md`](../../../rules/widget-testing-rules.md) — separate widget/hook tests, own prop-type mocks and state matrix; [`documentation/design.md`](../../../design.md).
- **Exit:** Run all signatory/card/candidate component and hook suites plus Web checks; compare fresh `sxENj` and `Vx43H` loading/empty/error/pagination screenshots, exercise keyboard focus trap and 390×844 reflow, and inspect console/hydration/failed-request evidence in `evaluation.md`.

#### F7-T4 — Implement field tab and PDF field viewer/editor

- **Status/owner:** `completed` — `orchestrator` (continuing `builder_web` implementation)
- **Depends/parallel:** Depends on F7-T3; no parallel task in `builder_web`.
- **Paths:** `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/`; its component and hook tests, including `signature-pdf-viewer/`.
- **Contract:** `RF-05`, `RF-06`, `RF-07`, `RF-08`, `RF-12`, `RF-14`, `RF-15`, `RF-17`; `CA-05`, `CA-06`, `CA-07`, `CA-08`, `CA-09`, `CA-10`; Design nodes `HcT8k` and `CNjkl`.
- **Outcome:** Per-document preview states, configured-field counts and details, selected ready PDF loading, page/zoom/field semantics, pointer/touch/keyboard geometry editing, debounced serialized saves, private object-URL cleanup, failed retry and stale-reopen repair follow the Spec. The save action remains above the PDF viewer and field details identify the relevant client/collaborator.
- **Rules:** [`documentation/rules/ui-layer-rules.md`](../../../rules/ui-layer-rules.md) — “Keep UI logic inside the owning widget hook”, “Visual implementation follows the design system”, and “Mixing widget behavior with action/query hooks”; [`documentation/rules/widget-testing-rules.md`](../../../rules/widget-testing-rules.md) — component/hook behavior coverage and minimum matrix; [`documentation/design.md`](../../../design.md).
- **Exit:** Run field/viewer component and hook suites plus Web checks; compare fresh `HcT8k`/`CNjkl` ready, loading, failed/retry, unsaved, conflict and stale states, validate keyboard and 390×844 pointer/reflow behavior, capture screenshots, and inspect private PDF requests, console, hydration and failed-request evidence in `evaluation.md`.

#### F7-T5 — Implement removal dialog and authenticated route integration

- **Status/owner:** `completed` — `orchestrator` (continuing `builder_web` implementation)
- **Depends/parallel:** Depends on F7-T4; final sequential UI task.
- **Paths:** `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/remove-signature-signatory-dialog/`; its component and hook tests; `apps/web/tests/routes/formalization/formalization.index.test.tsx`; `apps/web/tests/routes/formalization/formalization-sending-configuration.test.tsx`.
- **Contract:** `RF-04`, `RF-07`, `RF-13`, `RF-14`, `RF-16`; `CA-01`, `CA-04`, `CA-07`, `CA-09`, `CA-10`; Design node `GlZGA`; MV-01–MV-03.
- **Outcome:** Removal confirmation/error/pending/close-guard behavior and the protected Formalization route integration exercise the complete assembled tree, authenticated navigation and package/configuration handoff.
- **Rules:** [`documentation/rules/ui-layer-rules.md`](../../../rules/ui-layer-rules.md) — “Keep UI logic inside the owning widget hook”, “Visual implementation follows the design system”, and “Use shared HTTP status constants”; [`documentation/rules/widget-testing-rules.md`](../../../rules/widget-testing-rules.md) — stateful widget matrix and navigation boundaries; repository Playwright workflow in `AGENTS.md`.
- **Exit:** Run the removal suites and focused route test with `pnpm --filter web exec playwright test tests/routes/formalization/formalization.index.test.tsx --workers=1`; compare fresh `GlZGA` and assembled route screenshots, exercise authenticated keyboard/narrow paths, inspect console/hydration/failed requests, and record server-backed evidence in `evaluation.md`.

### F8 — Root/runtime wiring and integrated sensors

#### F8-T1 — Generate and review durable migration artifacts

- **Status/owner:** `completed` — `orchestrator`
- **Depends/parallel:** Depends on F5 and F7 integrated Builder diffs; first Orchestrator task and runs only after ownership review/no active migration path overlap.
- **Paths:** `apps/server/src/shared/database/drizzle/migrations/0040_formalization_signature_configuration.sql`; `apps/server/src/shared/database/drizzle/migrations/meta/0040_snapshot.json`; `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json`; `apps/server/src/shared/database/drizzle/migrations/tests/formalization-signature-configuration-migration.test.ts`.
- **Contract:** `RF-08`, `RF-18`; `CA-02`, `CA-05`, `CA-09`, `CA-10`; Spec database model and §4 migration command contract.
- **Outcome:** Generated SQL, snapshot and journal accurately represent `stored_files` and the Formalization signature tables, constraints, indexes, relations and legacy/no-FK decisions from the shared schema.
- **Rules:** [`documentation/tooling.md`](../../../tooling.md) — Drizzle generation and package filters; [`documentation/rules/database-layer-rules.md`](../../../rules/database-layer-rules.md) — “Drizzle models are declarations, not classes” and migration generation.
- **Exit:** Run `pnpm --filter server db:migration:generate --name formalization_signature_configuration` as specified; inspect SQL/snapshot/journal for tenant/lifecycle/CAS/foreign-key/index correctness, confirm no unrelated migration drift, add/run the focused migration test for roles, active-preview uniqueness, processing lease and stored-file FK, and complete focused migration/database checks before integration.

#### F8-T2 — Wire root runtime and execute integrated sensors

- **Status/owner:** `completed` — `orchestrator`
- **Depends/parallel:** Depends on F8-T1 and completed F5/F7 diffs; no parallel task.
- **Paths:** `docker-compose.yaml`; `apps/server/src/app.module.ts`; `pnpm-lock.yaml` when dependency installation changes; final integrated diff across the Spec scope.
- **Contract:** `RF-08`, `RF-18`; `CA-02`, `CA-05`, `CA-09`, `CA-10`; Spec Docker, root composition and §4 command contract.
- **Outcome:** Gotenberg is loopback-bound with health/resource limits, the single Inngest endpoint registers Formalization jobs exactly once, dependencies/lockfile are synchronized and the candidate integrates without altering authority docs or prohibited signing behavior.
- **Rules:** [`documentation/tooling.md`](../../../tooling.md); [`documentation/rules/server-app-layer-rules.md`](../../../rules/server-app-layer-rules.md) — “Technical layer directories own Nest modules”; [`documentation/rules/messaging-layer-rules.md`](../../../rules/messaging-layer-rules.md) — “Shared messaging owns the Inngest infrastructure”; [`AGENTS.md`](../../../AGENTS.md).
- **Exit:** Validate `docker compose config` and Gotenberg health, verify root Nest bootstrap and exactly-once Inngest registration, synchronize any required lockfile changes, then run current Spec Core/Validation/Server/Web checks and builds on the integrated commit. Do not mark complete from Builder reports alone.

### R1 — Integrated read-only review

#### R1-T1 — Audit the complete integrated candidate

- **Status/owner:** `completed` — `reviewer` (`Kuhn`)
- **Depends/parallel:** Depends on F8 integration; no replacement Reviewer is allowed after correction.
- **Paths:** Complete integrated Spec scope, generated artifacts, final widget tree, route examples, design references and `evaluation.md` validation index.
- **Contract:** All `RF-*` and `CA-*`; all `MV-*`; Design Contract and cross-cutting restrictions.
- **Outcome:** One independent review reports exact conformance, cross-Builder boundary findings, missing/stale evidence, UI/runtime defects and suggested responsible Builder without editing or deciding readiness.
- **Rules:** [`documentation/agents/reviewer-agent.md`](../../../agents/reviewer-agent.md); [`documentation/rules/sdd-rules.md`](../../../rules/sdd-rules.md) — “Roles”, “Implementation and living evidence” and “Integrated validation”; applicable Core, Validation, REST, Controller, Database, Provision, Messaging, UI and Widget Rules already assigned above.
- **Exit:** `reviewer` completes the read-only Spec/Rule/design audit, inspects every final visual comparison, independently replays high-risk authenticated/keyboard/server-backed interactions, and returns a report with explicit `none` or actionable findings. The Orchestrator verifies findings and resumes the responsible Builder when needed.

### F9 — Final readiness and handoff

#### F9-T1 — Execute and record final validation results

- **Status/owner:** `in_progress` — `orchestrator`
- **Depends/parallel:** Depends on R1 and any verified findings being corrected and rechecked by the same Reviewer; first finalization task and no parallel task.
- **Paths:** Integrated candidate; `evaluation.md`; generated artifacts; transient validation output; final validation index.
- **Contract:** `CA-01`–`CA-10`; `MV-01`, `MV-03`, `MV-04`; Spec revision `15`; Validation and handoff table in this Plan.
- **Outcome:** Current Core/Validation/Server/Web commands, real services/accounts/fixtures, authenticated server-backed scenarios, manual MV flows, visual comparisons, transient IDs and console/network classifications are recorded against the integrated commit. Visual observations are retained; implementation screenshots are not.
- **Rules:** [`documentation/rules/sdd-rules.md`](../../../rules/sdd-rules.md) — “Integrated validation”, “Changes before conclusion” and “Publication, CI, and closure”; [`documentation/tooling.md`](../../../tooling.md).
- **Exit:** Primary real authenticated flow, narrow/keyboard path and required ready/preparing/candidate/editor states are inspected and recorded in `evaluation.md`; screenshots, when used, are transient and not stored in the feature directory. No removed supplemental scenario is treated as a closure blocker.

#### F9-T2 — Perform final conformance gate and handoff

- **Status/owner:** `pending` — `orchestrator`
- **Depends/parallel:** Depends on F9-T1; final task and no parallel task.
- **Paths:** `plan.md`; `spec.md`; `evaluation.md`; final integrated tree; generated migration/runtime artifacts; validation links and identifiers.
- **Contract:** Spec revision `15`; all in-scope `RF-*`, `CA-*`, `MV-01`, `MV-03`, `MV-04`; Design Contract and final handoff condition in this Plan.
- **Outcome:** Ledger and task cards are complete, the revision-15 Contract amendment is reconciled, every verified Reviewer finding is resolved, all authority/design/runtime evidence is current and the delivery is ready for `conclude-spec`.
- **Rules:** [`documentation/rules/sdd-rules.md`](../../../rules/sdd-rules.md) — “Roles”, “Integrated validation”, “Changes before conclusion” and “Publication, CI, and closure”; [`documentation/agents/reviewer-agent.md`](../../../agents/reviewer-agent.md); [`documentation/tooling.md`](../../../tooling.md).
- **Exit:** Independently verify task/phase statuses, current command outputs, generated artifacts, real persistence/authorization results, transient screenshot/reference comparisons, validation IDs, console/network cleanliness and Reviewer finding resolution; then route directly to `conclude-spec`, with no unsupported green status.

## Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Validation record | Status |
| --- | --- | --- | --- | --- | --- |
| Manual | `MV-01` — real authenticated configuration | `CA-01`, `CA-03`, `CA-04`, `CA-05`, `CA-07`, `CA-10` | Spec MV-01 | `./evaluation.md#authenticated-flow`, `#privacy`, `#assignments`, `#pdf-previews`, `#readiness` | `completed` |
| Manual | `MV-03` — narrow and keyboard editor | `CA-06` | Spec MV-03 | `./evaluation.md#field-editor` | `in_progress` |
| Manual | `MV-04` — converter recovery | `CA-05`, `CA-07` | Spec MV-04 | `./evaluation.md#pdf-previews`, `#readiness` | `completed` |
| Runtime | Core use-case, static and type checks | `CA-01`–`CA-09` | Spec §4 commands and test tree | `./evaluation.md#automated-core` | `passed` |
| Runtime | Shared Validation schemas and event boundaries | `CA-03`, `CA-05`, `CA-06`, `CA-09` | Spec §4 commands and test-free Validation policy | `./evaluation.md#automated-validation` | `passed` |
| Runtime | Server providers, database, jobs, controllers and REST examples | `CA-01`–`CA-05`, `CA-07`–`CA-10` | Spec §4 Server Contract and test tree | `./evaluation.md#automated-server` | `passed` |
| Runtime | Web service, widget/hook and route suites | `CA-01`, `CA-03`–`CA-10` | Spec §4 Web Contract and test tree | `./evaluation.md#automated-web` | `passed` |
| Runtime | Covered-workspace test coverage | Core, Server and Web behavior boundaries | Root `pnpm test:coverage` excluding `@hms/validation` | `./evaluation.md#automated-and-runtime-evidence` | `passed` |
| Runtime | Dependency architecture checks | module and layer boundaries | Root/workspace `check:architecture` commands | `./evaluation.md#automated-and-runtime-evidence` | `passed` |
| Visual | `YWfhi` ready configuration card at 944 × 608 root | `CA-07` | [`design/YWfhi.png`](./design/YWfhi.png), manifest row `YWfhi` | Transient Playwright inspection and independent tree/token comparison; retain observations only | `completed` |
| Visual | `YWfhi` `preparing_configuration` progress at 1440 × 1000 | `CA-05`, `CA-07` | Spec/manifest accepted preparation-state assumption; MV-01/MV-04 | Transient inspection with generated/total progress, locked fields and console/request classification | `completed` |
| Visual | `sxENj` configuring signatories at 1200 × 914 | `CA-03`, `CA-04`, `CA-07` | [`design/sxENj.png`](./design/sxENj.png), manifest row `sxENj` | Transient Playwright inspection and independent widget-tree comparison; retain observations only | `completed` |
| Visual | `Vx43H` candidate dialog at 620 × 680 | `CA-03` | [`design/Vx43H.png`](./design/Vx43H.png), manifest row `Vx43H` | Transient inspection with loading/empty/error/pagination state observations | `completed` |
| Visual | `HcT8k` ready field editor at 1200 × 1100 | `CA-05`, `CA-06` | [`design/HcT8k.png`](./design/HcT8k.png), manifest row `HcT8k`/`CNjkl` | Transient inspection with selected preview, viewer, controls, fields and save-state observations | `completed` |
| Visual | `GlZGA` signatory-removal dialog at 480 × 411 root | `CA-04` | [`design/GlZGA.png`](./design/GlZGA.png), manifest row `GlZGA` | Transient inspection with focus trap, consequence copy and pending/error observations | `pending` |
| Visual | 390 × 844 keyboard/reflow field editor | `CA-06` | Spec/manifest responsive contract; MV-03 | Transient narrow inspection, keyboard trace, no page overflow and console/request classification | `completed` |
| Visual | `initialization_required` state at 1440 × 1000 | `CA-01`, `CA-02` | Spec/manifest supplemental-state assumption | Transient inspection and explicit POST-only initialization behavior | `completed` |

The final handoff requires all ledger tasks and phases to be `completed`, the Spec validation commands to be current on the integrated commit, generated artifacts and migrations reviewed, services/accounts/fixtures ready, the in-scope manual scenarios executable, transient artifact identifiers recorded, every supplied design reference compared independently, the final Spec widget-tree/conformance comparison passed, the single `reviewer` completed and every verified finding resolved. Removed supplemental scenarios are not closure prerequisites. Then route directly to `conclude-spec`.
