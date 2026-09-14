---
title: Conclusão da Formalização e acompanhamento de assinaturas — implementation plan
status: completed
spec: ./spec.md
spec_revision: 6
evaluation: ./evaluation.md
jira_tickets:
  - SCRUM-145
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/24051713
updated_at: 2026-09-11
---

## Execution status

- **Spec:** [`./spec.md`](./spec.md), revision `6`, `completed`.
- **Rationale:** Plan-backed execution is required for the cross-package domain/validation/server/web work, owner-boundary transactions, generated migration artifacts, provider/job changes, design-backed browser validation and durable recovery state.
- **Current phase:** `F6` — complete.
- **Next action:** None; the delivery PR set is published and every applicable CI workflow passed.
- **Active blockers:** None. The structural gate passes all 239 declared paths; the ready-to-send and confirmed browser states were freshly validated on isolated services; the application schema in `postgres` was recreated from the full migration journal and seeded; Supabase `auth` and `storage` schemas were preserved; `hms-bucket` is the canonical storage bucket with the seeded Formalization files; and all applicable CI workflows passed on PRs 144–146. The 99% screenshot is a documented controlled response fixture because the seeded two-document aggregate cannot naturally render 99%. The repository worktree still contains unrelated user-owned changes that remain outside the delivery commits.
- **Builders:** `builder_core`, `builder_validation`, `builder_server` and `builder_web` completed their owned phases; `builder_core` was resumed for the resend-envelope correction and `builder_web` was resumed for the final tracking-panel accessibility correction. Their regression evidence is green.
- **Coordination:** Orchestrator owns the three generated Drizzle outputs, `documentation/modules.md`, structural-gate execution, final integration and Evaluation. No package installation, root configuration or lockfile change is authorized by this Spec.

## Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `builder_core` | F1 | Establish Core domain contracts and exports | — | — | `completed` | Core domain/interface/composition paths compile and pass architecture/type checks; no cross-module persistence imports or new business logic outside use cases |
| 2 | `builder_core` | F2 | Implement Core use cases and truth-table tests | F1 | `builder_validation` | `completed` | Core use-case tests cover readiness, authorization, resend, cancellation, contracting, completion, Case projection, freeze and direct-Intake-transition rejection |
| 2 | `builder_validation` | F2 | Implement transport schemas and package exports | F1 | `builder_core` | `completed` | Validation architecture, types and lint pass; strict request/response schemas match Core contracts and contain no business authorization |
| 3 | `builder_server` | F3 | Implement Server persistence, owner adapters, composition, REST and jobs | F2 Core + F2 Validation | `builder_web` | `completed` | Server architecture/types/tests and Inngest suite pass; real controller tests prove response mapping, authorization, persistence/rollback and post-commit effects |
| 3 | `builder_web` | F4 | Implement Web REST adapters, routes, pages, widgets and tests | F2 Core + F2 Validation | `builder_server` | `completed` | Web generation/code/architecture/types/unit/focused-route suites pass; widget trees match the Spec and design references with keyboard, narrow viewport, console/network and screenshot evidence |
| 4 | Orchestrator | F5 | Generate artifacts, align documentation and integrate the candidate | F3/F4 implementation integrated; model-backed exits blocked on generated schema | — | `completed` | Generated migration/snapshot/journal are inspected with model changes; `documentation/modules.md` is aligned; all 239 Spec paths are integrated and the structural gate has a current passing Evaluation row |
| 5 | `reviewer` | F6 | Perform the single integrated read-only review | F5 passing structural gate | Orchestrator integrated sensors/manual validation | `completed` | Same reviewer rechecked the corrected Inngest fixture, found no implementation regression, and identified only incomplete Server coverage evidence |
| 5 | Orchestrator | F6 | Complete integrated validation and hand off | F5; reviewer complete | `completed` | Structural gate, integrated sensors, reviewer recheck, current runtime/visual evidence and the final PR CI quality gate are recorded; Evaluation and Spec are closed. |

### F1 — Core domain contracts and exports

#### F1-T1 — Establish owner-local domain contracts

- **Status/owner:** `completed` — `builder_core` (Turing, `01a082ea-28fc-7722-9ba9-9e60dc71881c`)
- **Depends/parallel:** No dependency; the only implementation task in Wave 1. This establishes contracts for F2, F3 and F4.
- **Paths:** Every canonical `Create`, `Modify` and `Remove` row in the Spec sections `packages/core — Domain`, `packages/core — Interfaces` and `packages/core — Composition`; generated paths and use-case rows are excluded and owned by F5 and F2 respectively.
- **Contract:** `FR-01`–`FR-11`; `AC-01`–`AC-11`, `AC-13`.
- **Outcome:** Formalization, Intake, Document Production and Case Management expose the exact entity, structure, error, port, transaction and barrel contracts in the Spec; frozen PDFs are owned by Document Production; Intake exposes only its public contracting boundary; completion remains independent of Case creation.
- **Rules:** `documentation/rules/code-conventions-rules.md` (imports, one declaration per file); `documentation/rules/core-package-rules.md` (`Business Logic`, `One exported type per file`, `Ports and adapters`, `Antipatterns to Avoid`); `documentation/rules/use-case-testing-rules.md` (test boundary for the contracts consumed by F2).
- **Exit:** `pnpm --filter @hms/core check:architecture && pnpm --filter @hms/core check-types`; inspect exports and imports against the Spec path tree; confirm no repository/table dependency crosses an owner boundary and no use-case business rule was placed in an Entity, Structure or port.

### F2 — Core behavior and shared validation

#### F2-T1 — Implement Core actions and truth tables

- **Status/owner:** `completed` — `builder_core` (Turing, `01a082ea-28fc-7722-9ba9-9e60dc71881c`)
- **Depends/parallel:** F1 complete; parallel with F2-T2 on disjoint `packages/validation` paths.
- **Paths:** Every canonical row in the Spec section `packages/core — Use cases`, including its listed Core use-case test rows.
- **Contract:** `AC-01`–`AC-11`, `AC-13`; `MV-01`–`MV-03` projections consumed by later layers.
- **Outcome:** Status/read authorization, resend rotation, reasoned cancellation, contracting readiness/idempotency/CAS, Intake contracting, completion summary, Case summary, PDF freeze and preview reuse execute through Core ports with deterministic error and timestamp behavior.
- **Rules:** `documentation/rules/core-package-rules.md` (`Business Logic`, `Use Cases`, `Ports and adapters`, `Antipatterns to Avoid`); `documentation/rules/use-case-testing-rules.md` (`Truth tables`, `Mocking`, `DatetimeProvider`, `Antipatterns to Avoid`).
- **Exit:** `pnpm --filter @hms/core check-types && pnpm --filter @hms/core test`; verify every action’s authorization, invalid-state, concurrency/idempotency, no-partial-commit and side-effect timing rows, with no repository tests added.

#### F2-T2 — Implement strict transport contracts

- **Status/owner:** `completed` — `builder_validation` (Averroes, `01a08307-6f49-72b0-be51-6191da7fefa6`)
- **Depends/parallel:** F1 complete; parallel with F2-T1. Server and Web wait for both F2 tasks.
- **Paths:** Every canonical row in the Spec section `packages/validation — Validation`.
- **Contract:** `FR-01`–`FR-12`; `AC-01`–`AC-13` transport representations.
- **Outcome:** Formalization tracking/action/completion, Intake `contractedAt` and Case summary schemas validate strict request/response shapes, serialize dates, and export the exact package subpaths required by Server and Web.
- **Rules:** `documentation/rules/validation-package-rules.md` (`Schema ownership`, `Strictness`, `Antipatterns to Avoid`); `documentation/rules/code-conventions-rules.md` (explicit type imports and exports).
- **Exit:** `pnpm --filter @hms/validation check:architecture && pnpm --filter @hms/validation check-types && pnpm --filter @hms/validation lint`; inspect positive-version, trimmed-reason, UUID, ISO-date, nullable and unknown-key behavior without adding tests to the validation package.

### F3 — Server persistence, integrations and REST

#### F3-T1 — Implement owner persistence, provision, composition, REST and messaging

- **Status/owner:** `completed` — `builder_server` (Halley, `01a08310-71f8-7030-ad90-87182a8b2b1d`)
- **Depends/parallel:** F2-T1 and F2-T2 complete; parallel with F4-T1. F5 owns generated migration outputs and must not be started from this task.
- **Paths:** Every canonical non-generated `Create`, `Modify` and `Remove` row in the Spec sections `apps/server — REST`, `apps/server — Provision`, `apps/server — Database`, `apps/server — Messaging` and `apps/server — Composition`; the three `Generate` migration rows are excluded and owned by F5.
- **Contract:** `FR-01`–`FR-11`; `AC-01`–`AC-11`, `AC-13`; `MV-01`–`MV-03` server evidence.
- **Outcome:** Drizzle models/mappers/repositories resolve the ambient executor; owner modules expose only public services; frozen PDF conversion/inspection is reusable; REST controllers remain thin with matching `.rest` examples; resend publication is post-commit/recoverable; cancellation and preview jobs preserve existing lifecycle semantics.
- **Rules:** `documentation/rules/rest-layer-rules.md` (`Controller design`, `REST client files`, `Antipatterns to Avoid`); `documentation/rules/controllers-testing-rules.md` (`Integration tests`, `Real persistence`, `Antipatterns to Avoid`); `documentation/rules/database-layer-rules.md` (`Module ownership`, `Transactions`, `Migrations`, `Antipatterns to Avoid`); `documentation/rules/provision-layer-rules.md` (`Provider boundary`, `Storage`, `Antipatterns to Avoid`); `documentation/rules/server-app-layer-rules.md` (`Module composition`, `Antipatterns to Avoid`); `documentation/rules/messaging-layer-rules.md` (`After commit`, `Recovery`, `Antipatterns to Avoid`); `documentation/rules/jobs-testing-rules.md` (`Integration`, retry classification, `Antipatterns to Avoid`).
- **Exit:** `pnpm --filter server check:architecture && pnpm --filter server check:types && pnpm --filter server test && pnpm --filter server test:inngest`; controller/integration evidence must use real request/response plus persistence, rollback, authorization, provider-resource and post-commit publication results. Mocked transport alone cannot close this task.

### F4 — Web adapters, routes and UI

#### F4-T1 — Implement Web REST, route composition and nested widgets

- **Status/owner:** `completed` — `builder_web` (Wegener, `01a08310-6639-7841-9d17-a28e3ad9693b`), resumed for required tests/Playwright evidence
- **Depends/parallel:** F2-T1 and F2-T2 complete; parallel with F3-T1. Real browser/server-backed evidence waits for F5 integration and service health.
- **Paths:** Every canonical `Create` and `Modify` row in the Spec sections `apps/web — REST`, `apps/web — UI` and `apps/web — route validation`.
- **Contract:** `FR-01`–`FR-04`, `FR-06`, `FR-09`, `FR-10`, `FR-12`; `AC-01`–`AC-07`, `AC-10`–`AC-12`; all seven supplied design references and accepted supplemental states in `design/manifest.md`.
- **Outcome:** Formalization and Case adapters, two-tab tracking/configuration, exact nested widget tree, resend/cancel dialogs, main-page contracting action, contracted Intake cards, canonical routes and paired widget/hook tests are implemented with token-based responsive and accessible states; `routeTree.gen.ts` is generated/read-only.
- **Rules:** `documentation/rules/ui-layer-rules.md` (`Widget ownership`, `State matrix`, `Query/action hooks`, `Antipatterns to Avoid`); `documentation/rules/web-app-routing-rules.md` (`Canonical routes`, `Generated route tree`, `Route tests`, `Antipatterns to Avoid`); `documentation/rules/widget-testing-rules.md` (`Component/hook separation`, `Accessible assertions`, `Antipatterns to Avoid`); `documentation/rules/code-conventions-rules.md`; `documentation/design.md` (tokens, typography, contrast and responsive behavior).
- **Exit:** Run `pnpm --filter web generate-routes`, `pnpm --filter web check:code`, `pnpm --filter web check:architecture`, `pnpm --filter web check:types`, `pnpm --filter web test`, and each focused route command from the Spec. For every affected design state, compare the exact Spec widget tree with the rendered tree; exercise keyboard and `390 × 844` behavior; inspect console and failed requests; and capture a fresh Playwright CLI screenshot for each supplied/reference or required supplemental state. Mocked route evidence is labeled mocked and does not replace F5 real-server evidence.

### F5 — Generated artifacts, documentation and structural integration

#### F5-T1 — Generate migration outputs, align ownership documentation and integrate

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** F3-T1 and F4-T1 complete; no Builder runs in parallel because this task owns shared/generated outputs and integration.
- **Paths:** `apps/server/src/shared/database/drizzle/migrations/0043_formalization_completion.sql`, `apps/server/src/shared/database/drizzle/migrations/meta/0043_snapshot.json`, `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json`, and `documentation/modules.md` — the only canonical paths not owned by F1–F4.
- **Contract:** `FR-07`, `FR-08`, `FR-09`, `FR-10`, `FR-11`; `AC-06`, `AC-08`, `AC-10`, `AC-11`, `AC-13`.
- **Outcome:** The exact migration is generated from authoritative models, guarded backfills and constraints are inspected with the snapshot/journal, module ownership documentation matches the Spec, all Builder paths are integrated without overlap, and the final tree is ready for runtime validation.
- **Rules:** `documentation/rules/database-layer-rules.md` (`Generated migrations`, `Backfills`, `Antipatterns to Avoid`); `documentation/rules/server-app-layer-rules.md` (`Composition`); `documentation/modules.md`; `documentation/tooling.md` (`Drizzle generation`, validation order); `documentation/sdd.md` (Evaluation ownership).
- **Exit:** Run `pnpm --filter server db:migration:generate --name formalization_completion`, inspect generated schema plus the explicitly contracted guarded data-transition additions with the snapshot/journal together, run the migration contract test, and verify no uncontracted generated content is changed. Then run `pnpm check:spec-implementation -- documentation/features/formalization/formalization-completion/spec.md --base HEAD --json`; Evaluation must record the exact command, base ref `HEAD`, resolved base SHA, every reported count and a passing result before F6 begins.

### F6 — Integrated review and readiness

#### F6-T1 — Independently review the integrated candidate

- **Status/owner:** `completed` — `reviewer`
- **Depends/parallel:** F5-T1’s current passing structural-gate row; parallel with Orchestrator-owned integrated sensors and manual validation. This is the single implementation Reviewer for the Plan.
- **Paths:** Read-only review of the complete integrated candidate and all 239 canonical paths; no write ownership.
- **Contract:** Entire Spec, especially `AC-03`–`AC-13`, `MV-01`–`MV-03`, generated migration integrity, owner boundaries and all design states.
- **Outcome:** The Reviewer checks cross-Builder contracts, complete final tree, Rules, generated outputs, server-backed behavior, UI accessibility/responsiveness and evidence freshness, then reports findings to the Orchestrator without deciding the official verdict.
- **Rules:** `documentation/agents/implementation-reviewer-agent.md`; `documentation/rules/rules.md`; all Rule Pack entries selected by the Spec; `AGENTS.md` authenticated-browser workflow.
- **Exit:** The named `reviewer` completed its read-only report after consuming the passing gate row; the Orchestrator verified each finding, recorded accepted findings in `evaluation.md`, resumed the responsible Builders for corrections, and obtained the same Reviewer’s recheck of the corrected surfaces.

#### F6-T2 — Complete runtime validation and hand off

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** F5-T1 and F6-T1; manual sensors may run alongside F6-T1 only after the gate is current.
- **Paths:** No new canonical implementation paths; owns `evaluation.md` evidence and transient validation artifacts.
- **Contract:** `MV-01`, `MV-02`, `MV-03`; `AC-01`–`AC-13`; final Spec conformance.
- **Outcome:** Core/Validation/Server/Web/workspace gates, build, Docker/Auth/Inngest health, disposable migration/seed, persistent Server/Web sessions, route suites and all manual scenarios are current and clean; no console, hydration, unexpected request, auth refresh, partial commit, Case side effect or stale visual evidence remains.
- **Rules:** `AGENTS.md` authenticated-browser workflow; `documentation/tooling.md`; `documentation/sdd.md`; `documentation/rules/controllers-testing-rules.md`; `documentation/rules/widget-testing-rules.md`; `documentation/rules/web-app-routing-rules.md`.
- **Exit:** Evaluation records exact commands/results, real request/response and DB/provider/Inngest identifiers, screenshots/traces/console/failed-request evidence, exact design-state comparisons and supplemental-screenshot decisions. All tasks/phases are complete, generated artifacts are reviewed, every `MV-*` passes, the gate and Reviewer rows are current, and the task routes directly to `conclude-spec`.

## Validation and handoff

### Structural gate

The first integrated checkpoint is F5-T1, after all Builder-owned paths and Orchestrator-owned generated/documentation paths are integrated and before the Reviewer or readiness verdict:

```bash
pnpm check:spec-implementation -- documentation/features/formalization/formalization-completion/spec.md --base HEAD --json
```

Evaluation must record the resolved base SHA, all counts and result. A pre-implementation diagnostic on 2026-09-08 resolved `origin/develop` to `529b874808c88f8ec098fface014e2cc30f8c031` and reported `239` declared paths, `29` passed paths, `403` failed checks, `1,296` changed files and `1,207` unrelated changed files; it failed because the current worktree contains unrelated changes and because `origin/develop` predates the committed Formalization foundation on this branch, so it is not evidence for the final candidate. The candidate gate uses `HEAD` as the selected implementation baseline. Any change to the Spec revision, base SHA, integrated changed-file set or declared path mapping invalidates the row and requires a rerun.

### Coverage and evidence

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Runtime/manual | Operator tracking, resend, cancellation and contracting | `AC-01`–`AC-09`, `AC-13` | `MV-01` in Spec | `./evaluation.md` with real REST/DB/provider/Inngest identifiers | `passed_with_environment_note` |
| Runtime/manual | Contracted Intake with no Case and with Case | `AC-08`, `AC-10`–`AC-12` | `MV-02` in Spec | `./evaluation.md` with both Case states and optional-failure evidence | `passed_with_environment_note` |
| Runtime/manual | Operator, linked recipient and forbidden collaborator projection | `AC-03`, `AC-04`, `AC-12` | `MV-03` in Spec | `./evaluation.md` role matrix and no-disclosure network evidence (`EV-LIVE-ROLES`) | `passed_with_environment_note` |
| Visual | Completed Formalization card | `AC-10`, `MV-02` | [`JOoMf.png`](./design/JOoMf.png) | `/tmp/hms-visual-formalization-card-final.png` plus full-page comparison; status recorded in Evaluation | `passed_with_environment_note` |
| Visual | Case not started | `AC-11`, `MV-02` | [`C4XC5D.png`](./design/C4XC5D.png) | `/tmp/hms-visual-case-empty-card-final.png` plus full-page comparison; disabled-action deviation verified | `passed_with_environment_note` |
| Visual | Related Case summary | `AC-11`, `MV-02` | [`N2Xvj.png`](./design/N2Xvj.png) | `/tmp/hms-visual-case-present-card-final.png` plus full-page comparison | `passed_with_environment_note` |
| Visual | Contracted Intake without Case | `AC-10`–`AC-12`, `MV-02` | [`w0QbVY.png`](./design/w0QbVY.png) | `/tmp/hms-visual-intake-no-case-final-1200x2300.png` and page-tree comparison | `passed_with_environment_note` |
| Visual | Contracted Intake with Case | `AC-10`–`AC-12`, `MV-02` | [`okATx.png`](./design/okATx.png) | `/tmp/hms-visual-intake-with-case-final-1200x2300.png` and page-tree comparison | `passed_with_environment_note` |
| Visual | Signature tracking | `AC-01`–`AC-07`, `AC-12`, `MV-01` | [`FbWzH.png`](./design/FbWzH.png) | `/tmp/hms-visual-tracking-1200x1240.png` plus `/home/petros/projects/hms/.playwright-cli/page-2026-09-09T15-15-36-063Z.png` and tracking widget-tree comparison | `passed_with_environment_note` |
| Visual | Sending in progress | `AC-02`, `AC-07`, `AC-12`, `MV-01` | [`MC4E2.png`](./design/MC4E2.png) | Real Documenso `PENDING` envelope and HMS sending/partial route capture at `1200×900`: `/home/petros/projects/hms/.playwright-cli/page-2026-09-09T15-15-36-063Z.png` | `passed_with_environment_note` |
| Visual/manual | Tracking narrow layout | `AC-12`, `MV-01` | Manifest supplemental decision | `/tmp/hms-visual-tracking-narrow-390x844.png`, keyboard, overflow, console/request evidence | `passed_with_environment_note` |
| Visual/manual | Cancellation dialog | `AC-06`, `MV-01` | Manifest supplemental decision | `/tmp/hms-formalization-cancel-dialog-final-1200x900.png`, focus/reason/pending-state evidence and persisted cancellation | `passed_with_environment_note` |
| Visual/manual | Resend feedback | `AC-05`, `MV-01` | Manifest supplemental decision | `/tmp/hms-formalization-resend-dialog-final-1200x900.png`, `/tmp/hms-formalization-resend-success-refreshed-1200x900.png` and provider/DB request evidence | `passed_with_environment_note` |
| Visual/manual | Contract confirmation states | `AC-07`–`AC-09`, `MV-01` | Manifest supplemental decision | `/tmp/hms-formalization-99-percent-1200x900.png`, `/tmp/hms-visual-ready-main-1200x900.png` and `/tmp/hms-formalization-confirmed-1200x900.png` | `passed_with_environment_note` |
| Visual/manual | Tracking-only projection | `AC-04`, `MV-03` | Manifest supplemental decision | Fresh linked-recipient snapshot `/tmp/hms-role-lawyer-linked.yml` and no-disclosure network evidence | `passed_with_environment_note` |

### Final handoff

Route directly to `conclude-spec` only when every task and phase is complete; the Spec revision is `6` and `in_progress`; the integrated candidate has current Core, Validation, Server, Web, workspace, build, migration, Inngest, health, route and `MV-*` evidence; the three generated artifacts and `documentation/modules.md` are reviewed; services, accounts and disposable fixtures are ready; all supplied and required design states have fresh comparisons or the manifest’s accepted deferral is recorded; the structural path gate is current and passing; `reviewer` is complete; every verified review finding is resolved and no blocker remains.
