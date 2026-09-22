---
title: Dynamic form editor page — implementation plan
status: in_progress
spec: ./spec.md
spec_revision: 7
evaluation: ./evaluation.md
jira_tickets:
  - SCRUM-142
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2654209/PRD+M+dulo+de+Cat+logo+Jur+dico
updated_at: 2026-09-21
---

# Execution status

- **Spec:** `documentation/features/legal-catalog/dynamic-form-editor-page/spec.md`, revision 7, `in_progress`.
- **Rationale:** Plan-backed execution is required by the four-layer ownership boundary, generated migration, durable replay/versioning, and complex authenticated browser validation.
- **Current phase:** Wave 4/5 — integrated gate and review corrections complete; F1–F7 implementation paths and F9 review are complete, while F8/F10 remain open. Spec revision 7 reconciles the committed stacked baseline, implemented Web composition leaves and approved compatibility corrections.
- **Selected baseline:** `origin/feat/dynamic-forms-page` at `325764682a8814d15bd621039c8506737171725d`; this dependent branch already contains the canonical Core/Server/Web dynamic-forms delivery.
- **Delivery slices:** Slice 1 is `feat/dynamic-form-editor-page`, based on `feat/dynamic-forms-page`, and contains Core, Validation, Server, migration and compatibility contracts. Slice 2 is `feat/dynamic-form-editor-page-web`, based on Slice 1, and contains the Web foundation: routes, REST adapter, query/action hooks, shared UI corrections and route coverage. Slice 3 is `feat/dynamic-form-editor-page-web-ui`, based on Slice 2, and contains the editor widgets, component/hook coverage and remaining browser-facing UI.
- **Next action:** Complete the remaining evidence conditions: exact Pencil visual matrix and the manual retry/no-op and Formalização lifecycle scenarios; retain the current Server integration and repository-wide inherited failures with their classifications.
- **Active blockers:** The user-local schema divergence is repaired through forward migrations `0047`–`0050`; Storage is aligned to the provisioned private `documents` bucket; the real server seed plus a fresh browser create/update/reload flow complete; the focused Testcontainers usage-impact controllers pass 8/8; and fresh browser evidence covers the stale-version flow and attendant API `403` responses. The selected stacked-base gate is re-run against the canonical current-branch baseline during publication. Exact supplied-reference screenshots and the complete manual retry/no-op and Formalização lifecycle scenarios remain incomplete. Repository-wide coverage and Web integration retain inherited failures as recorded in Evaluation. The feature-local `design/handoff.md` is the explicitly approved replacement for the former `manifest.md` name and contains the required inventory and reference bundle.
- **Builders:** `builder_core` (`01a0a690-6e88-71b3-9789-aafd84112771`), `builder_validation` (`01a0a690-6034-7762-8d9e-02f594e6c83b`), `builder_server` (`01a0a6ad-4171-7642-9153-7da3a228169b`) and `builder_web` (`01a0a6ad-e312-79d2-8a0b-71f61fc3df53`) completed their assigned implementation paths. A short-lived follow-up provider Builder (`01a0a704-2820-7650-8028-2cdc1de323c9`) corrected the field-impact JSONB predicate within the same Server ownership boundary and was closed after handoff.
- **Builders:** `builder_core` (`01a0a690-6e88-71b3-9789-aafd84112771`), `builder_validation` (`01a0a690-6034-7762-8d9e-02f594e6c83b`), `builder_server` (`01a0a6ad-4171-7642-9153-7da3a228169b`) and `builder_web` (`01a0a6ad-e312-79d2-8a0b-71f61fc3df53`) completed their assigned implementation paths. A short-lived follow-up provider Builder (`01a0a704-2820-7650-8028-2cdc1de323c9`) corrected the field-impact JSONB predicate within the same Server ownership boundary and was closed after handoff. The PR correction activated `builder_fix_web` (`/root/builder_fix_web`) and then replacement `builder_fix_web_retry` (`/root/builder_fix_web_retry`) when the first assignment could not be resumed, both with ownership limited to `apps/web/tests/routes/legal-catalog/formularios-dinamicos.index.test.tsx`; Spec, Plan, Evaluation, production code and every other path are prohibited.
- **Coordination:** The Orchestrator owns `apps/web/package.json`, `pnpm-lock.yaml`, generated migration artifacts, route-generation review, integration, and the Evaluation. `builder_server` owns all non-generated Server implementation paths; `builder_web` owns all Web implementation paths. Existing local edits to `documentation/infrastructure.md` and `documentation/sdd.md` remain user-owned and are not part of implementation.

# Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `builder_core` | F1 | Core contracts and definition workflows | — | F2 | `completed` | Core unit suites, type/lint/architecture checks pass for the declared Core paths. |
| 1 | `builder_validation` | F2 | Transport schemas and error envelope syntax | — | F1 | `completed` | Validation type/lint/architecture checks pass and schemas remain test-free. |
| 2 | `Orchestrator` | F3 | Web dependency prerequisite | F1, F2 | F4 | `completed` | dnd-kit dependencies are installed through the workspace, lockfile is consistent, and no undeclared package change exists. |
| 2 | `builder_server` | F4 | Persistence and usage-provider foundation | F1, F2 | F3 | `completed` | Database/provider implementation compiles against Core ports and has no direct cross-module table access. |
| 3 | `builder_web` | F5 | Protected editor routes and widgets | F1, F2, F3 | F6, F7 | `completed` | Focused Web widget/route suites and Web code/type/architecture checks pass; mocked transport is labeled. |
| 3 | `Orchestrator` | F6 | Generated migration and schema integration | F4 | F5, F7 | `completed` | Drizzle generation produces the declared migration/meta files, reviewed for compatibility and applied in the integration environment. |
| 3 | `builder_server` | F7 | REST controllers and Server composition | F4, F6 | F5 | `completed` | Real controller/database integration suites pass for authorization, persistence, replay, conflict and compatibility paths. |
| 4 | `Orchestrator` | F8 | Integrated structural and sensor gate | F5, F6, F7 | — | `in_progress` | Ordered package checks, build and focused feature suites have current passing rows; current official path gate remains failed by inherited base drift, coverage has one pre-existing timeout, and the latest focused Server integration now passes after the migration correction. |
| 5 | `reviewer` | F9 | Integrated implementation review | F8 | — | `completed` | Same read-only reviewer completed the correction pass; FND-012–FND-021 are resolved and no implementation finding remains. |
| 6 | `Orchestrator` | F10 | Final conformance and handoff | F9 | — | `in_progress` | All MV scenarios, exact visual comparisons, generated artifacts, services, accounts, evidence and readiness conditions must be current; currently blocked by incomplete visual/manual evidence, fixture contamination and official path-base drift. |

### F1 — Core contracts and definition workflows

#### F1-T1 — Implement the canonical definition, operation, version and impact contracts

- **Status/owner:** `completed` — `builder_core` (`01a0a690-6e88-71b3-9789-aafd84112771`)
- **Depends/parallel:** Starts after revision 4 is recorded; parallel with F2-T1, then unblocks Server and Web contracts.
- **Paths:** The exact Core paths declared in the Spec's domain, use-case, interface and shared-response affected-path tables: `packages/core/src/legal-catalog/**`, plus the declared Formalization provider interface, shared answer-validator regression and `packages/core/src/shared/responses/rest-response.ts`; no undeclared Core paths.
- **Contract:** FR-03, FR-05–FR-15; AC-02, AC-04–AC-13, AC-16.
- **Outcome:** Core owns normalized definition drafts, stable nested identities, validation, atomic create/full replacement, global operation replay, stale/no-op semantics, audit details, field-impact aggregation ports and unchanged consumer compatibility.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md` including `Antipatterns to Avoid — Adding readonly to every Structure field`; `documentation/rules/use-case-testing-rules.md` including one test file per use case, mocked ports and infrastructure-free tests; `documentation/rules/provision-layer-rules.md` for provider contracts.
- **Exit:** `pnpm --filter @hms/core test -- src/legal-catalog/use-cases/tests`; `pnpm --filter @hms/core check-types && pnpm --filter @hms/core lint && pnpm --filter @hms/core check:architecture`; verify unit evidence for exact replay/no-op-after-later-update, stale version, identity/order, rollback, type matrix and field impact.

### F2 — Transport schemas and error envelope syntax

#### F2-T1 — Add strict editor request and structured-error schemas

- **Status/owner:** `completed` — `builder_validation` (`01a0a690-6034-7762-8d9e-02f594e6c83b`)
- **Depends/parallel:** Starts after revision 4 is recorded; parallel with F1-T1 and does not import Core or own business rules.
- **Paths:** `packages/validation/src/legal-catalog/schemas/dynamic-form-definition-schema.ts`; `packages/validation/src/legal-catalog/schemas/index.ts`; `packages/validation/src/legal-catalog/index.ts`; `packages/validation/src/shared/schemas/error-response-schema.ts`.
- **Contract:** FR-06, FR-09–FR-11, FR-14; AC-06, AC-09–AC-11, AC-15.
- **Outcome:** POST/PUT syntax, discriminated field refinements, UUID/length/array/number constraints and ordered error issues are exported through the existing Validation boundary.
- **Rules:** `documentation/rules/validation-package-rules.md` including `Keep the package test-free`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** `pnpm --filter @hms/validation check-types && pnpm --filter @hms/validation lint && pnpm --filter @hms/validation check:architecture`; consumers must exercise schemas without adding Validation test files.

### F3 — Web dependency prerequisite

#### F3-T1 — Install the approved sortable interaction dependencies

- **Status/owner:** `completed` — `Orchestrator`
- **Depends/parallel:** After F1-T1/F2-T1; may run alongside F4-T1, and must complete before F5-T1.
- **Paths:** `apps/web/package.json`; `pnpm-lock.yaml`.
- **Contract:** FR-05, FR-14; AC-05, AC-14.
- **Outcome:** dnd-kit core/sortable/utilities are resolved using the approved workspace tooling and are available to the Web Builder without changing visual or domain authority.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/ui-layer-rules.md` including `Antipatterns to Avoid — Use shared HTTP status constants`; `documentation/tooling.md`.
- **Exit:** `pnpm install --lockfile-only`, `pnpm install --frozen-lockfile`, lockfile diff inspection, and Web architecture sensor passed; no unrelated package or lockfile changes.

### F4 — Persistence and usage-provider foundation

#### F4-T1 — Implement versioned persistence, operation replay and public impact providers

- **Status/owner:** `completed` — `builder_server`
- **Depends/parallel:** F1-T1 and F2-T1; parallel with F3-T1 and later F5-T1 once the public contracts are frozen.
- **Paths:** The exact Server database/provider paths declared by the Spec: Legal Catalog Drizzle models, mapper, administration/operations repositories, repository tokens/module, shared dynamic-form repository, Formalization source provider and shared usage aggregator; no REST controller or migration file in this task.
- **Contract:** FR-07, FR-09–FR-12, FR-15; AC-07, AC-09–AC-12, AC-16.
- **Outcome:** Existing definitions are mapped without consumer breakage; full replacement is atomic and version-predicated; operations/audit are durable; snapshot field counts cross module boundaries only through public provider ports.
- **Rules:** `documentation/rules/database-layer-rules.md` including `Repositories do not receive tests` and `Repository injection uses module tokens`; `documentation/rules/provision-layer-rules.md` including `Providers contain infrastructure concerns only`; `documentation/rules/server-app-layer-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** Server type/code/architecture checks for the changed foundation; verify no direct cross-module table access and that the repository/provider contracts are ready for generated migration and controller integration.

### F5 — Protected editor routes and widgets

#### F5-T1 — Implement the create/edit Web surface and isolated route/widget coverage

- **Status/owner:** `completed` — `builder_web` (`01a0a6ad-e312-79d2-8a0b-71f61fc3df53`)
- **Depends/parallel:** F1-T1, F2-T1 and F3-T1; parallel with F4-T1, F6-T1 and F7-T1. Real browser validation waits for integrated Server composition.
- **Paths:** `apps/web/src/rest/services/legal-catalog-service.ts`; `apps/web/src/routes/formularios-dinamicos/novo.tsx`; `apps/web/src/routes/formularios-dinamicos/$dynamicFormId.tsx`; `apps/web/tests/routes/legal-catalog/formularios-dinamicos.novo.test.tsx`; `apps/web/tests/routes/legal-catalog/formularios-dinamicos.$dynamicFormId.test.tsx`; the exact declared Legal Catalog hook paths; and the complete exact `apps/web/src/ui/legal-catalog/widgets/pages/dynamic-form-editor-page/` affected-path set (page, list/row, field dialog and five grouped configurations, nested options editor, preview, removal/unsaved/stale/delete dialogs, save bar, and every component/hook test pair).
- **Contract:** FR-01–FR-08, FR-10–FR-14; AC-01–AC-15.
- **Outcome:** Both protected routes render the single RHF/TanStack editor, local preview and stable client identity mapping; all nine type dialogs, accessible ordering, field impact/removal, save/retry/stale/dirty flows and responsive states are composed from existing HMS primitives.
- **Rules:** `documentation/rules/ui-layer-rules.md` including `Mirror widget structure for nested components`, `Keep React Query behind query/action hooks`, `Keep UI logic inside the owning widget hook`, `Shared wrappers own third-party UI boundaries`, `Application icons use Icon`, `Visual implementation follows the design system`, and `Antipatterns to Avoid`; `documentation/rules/web-app-routing-rules.md`; `documentation/rules/widget-testing-rules.md` including separate component/hook pairs and keyboard/accessibility coverage; `documentation/rules/rest-layer-rules.md` for the Web service adapter; `documentation/design.md`; `design/handoff.md`.
- **Exit:** `pnpm --filter web check:code && pnpm --filter web check:types && pnpm --filter web check:architecture`; `pnpm --filter web test -- src/ui/legal-catalog/widgets/pages/dynamic-form-editor-page`; focused Playwright CLI route suites; every UI exit also requires exact Spec widget-tree comparison, keyboard and 320×800 states, console/failed-request inspection, and a fresh screenshot for each affected handoff state. Mocked transport remains explicitly labeled.

### F6 — Generated migration and schema integration

#### F6-T1 — Generate and review the Drizzle migration artifacts

- **Status/owner:** `completed` — `Orchestrator`
- **Depends/parallel:** F4-T1; parallel with F5-T1 and F7-T1 after generation inputs are stable.
- **Paths:** `apps/server/src/shared/database/drizzle/migrations/0045_dynamic_form_editor.sql`; `apps/server/src/shared/database/drizzle/migrations/meta/0045_snapshot.json`; `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json`.
- **Contract:** FR-07, FR-09, FR-10, FR-15; AC-07, AC-09, AC-10, AC-16.
- **Outcome:** The declared schema migration/backfill preserves existing definitions, duplicate-operation replay results and historical snapshots while adding version/definition/operation/audit support.
- **Rules:** `documentation/rules/database-layer-rules.md`; `documentation/tooling.md`; `documentation/rules/code-conventions-rules.md` only for generated-file review boundaries.
- **Exit:** run `pnpm --filter server db:migration:generate`, inspect SQL and metadata for compatibility and ordering, apply with `pnpm --filter server db:migration:apply` in the real controller-integration environment, and record generated-file review plus persistence evidence in Evaluation.

### F7 — REST controllers and Server composition

#### F7-T1 — Wire protected REST actions, DTOs, errors and real integration tests

- **Status/owner:** `completed` — `builder_server` (`01a0a6ad-4171-7642-9153-7da3a228169b`)
- **Depends/parallel:** F4-T1 and F6-T1; parallel with F5-T1. Uses the exact frozen Core/Validation contracts.
- **Paths:** The exact remaining Server paths declared by the Spec: four new Legal Catalog controllers and controller tests/fixture, DTOs/barrels/module, duplicate-controller update, global error handler, existing list-controller compatibility test and Legal Catalog REST client example.
- **Contract:** FR-01, FR-02, FR-07, FR-09–FR-13, FR-15; AC-01–AC-04, AC-07, AC-09–AC-13, AC-15, AC-16.
- **Outcome:** Admin-only GET/POST/PUT/field-impact operations derive actor identity server-side, serialize typed responses, map structured failures and prove atomic persistence/replay/authorization through real Nest/database fixtures.
- **Rules:** `documentation/rules/rest-layer-rules.md` including one controller per action, DTO ownership, documented responses, global error handling and REST client coverage; `documentation/rules/controllers-testing-rules.md` including real infrastructure, one test file per controller and HTTP plus persistence assertions; `documentation/rules/database-layer-rules.md`; `documentation/rules/server-app-layer-rules.md`.
- **Exit:** `pnpm --filter server check:types && pnpm --filter server check:code && pnpm --filter server check:architecture`; `pnpm --filter server test:integration -- src/legal-catalog/rest/controllers/tests`; every changed server-backed behavior requires real request/response plus persistence or authorization evidence, never mocked transport alone.

### F8 — Integrated structural and sensor gate

#### F8-T1 — Integrate all paths and establish current Evaluation evidence

- **Status/owner:** `in_progress` — `Orchestrator`
- **Depends/parallel:** F5-T1, F6-T1 and F7-T1; no implementation Builder runs after this checkpoint unless a verified finding routes a correction through `implement-spec`.
- **Paths:** No additional implementation path; `evaluation.md` is created by `implement-spec` and owns operational evidence, while every Spec canonical path is already mapped exactly once above. Generated route metadata may change only if the declared route-generation command emits it and the result is reviewed as undeclared drift.
- **Contract:** All FR/AC, especially AC-09–AC-16 and the Validation Contract MV-01–MV-05.
- **Outcome:** The integrated candidate has current path-contract evidence, automated sensors, real services/accounts/fixtures and a reconciled visual/runtime evidence set.
- **Rules:** `documentation/sdd.md`; `documentation/tooling.md`; `AGENTS.md` browser-validation workflow; all selected Rule Pack documents as applicable to the integrated diff.
- **Exit:** Run `pnpm check:spec-implementation -- documentation/features/legal-catalog/dynamic-form-editor-page/spec.md --base origin/feat/dynamic-forms-page --json`; record the selected base SHA, counts and result in Evaluation. The default `origin/develop` diagnostic is not the delivery baseline because the canonical dynamic-forms slice is already in this branch. Then run the ordered Spec commands, full Web integration, root checks, `docker compose ps -a` and required health checks. Inspect console, hydration warnings, failed requests and 4xx/5xx classifications.

### F9 — Integrated implementation review

#### F9-T1 — Independently review the complete candidate

- **Status/owner:** `completed` — `reviewer` (`01a0a742-c0cb-7013-af78-34a847665896`)
- **Depends/parallel:** F8-T1 only; exactly one read-only reviewer consumes the passing structural-gate row.
- **Paths:** Complete integrated candidate across every mapped Core, Validation, Server, generated migration, Web, dependency and compatibility path.
- **Contract:** All FR/AC; cross-Builder contracts; every supplied and supplemental visual state.
- **Outcome:** Findings cover correctness, boundaries, generated artifacts, authorization, persistence, consumer compatibility and all affected UI surfaces without the Reviewer editing files or issuing the official verdict.
- **Rules:** `documentation/agents/implementation-reviewer-agent.md`; all Rule Pack documents activated by the final diff; `design/handoff.md` and `documentation/design.md` for visual review.
- **Exit:** Reviewer replays high-risk Playwright CLI interactions independently, inspects all final screenshots and reports findings. The Orchestrator verifies each finding, records it in Evaluation, resumes the owning Builder for in-Contract corrections, invalidates affected evidence and re-runs the same reviewer.

### F10 — Final conformance and handoff

#### F10-T1 — Confirm readiness and route directly to conclusion

- **Status/owner:** `in_progress` — `Orchestrator`
- **Depends/parallel:** F9-T1 and resolution of every verified finding.
- **Paths:** No new implementation paths; final status/evidence live in `plan.md` and `evaluation.md`.
- **Contract:** All FR/AC and MV-01–MV-05; final Spec tree/conformance comparison.
- **Outcome:** All tasks/phases are complete; migrations/generated outputs are reviewed; every manual/runtime/visual target is executable and recorded; no blocking finding remains.
- **Rules:** `documentation/sdd.md`; `documentation/tooling.md`; `AGENTS.md`; final applicable Rule Pack and design handoff.
- **Exit:** Verify current integrated-commit commands, exact widget-tree comparison, all 15 supplied references plus every scheduled supplemental state, fresh browser screenshots, narrow/keyboard/reduced-motion evidence, real authorization/persistence evidence and current structural gate. Then route directly to `conclude-spec`.

# Validation and handoff

The first integrated checkpoint is the structural path gate, before the Reviewer or readiness assessment. This delivery is a dependent slice, so the canonical baseline is the already integrated `origin/feat/dynamic-forms-page` branch:

```bash
pnpm check:spec-implementation -- documentation/features/legal-catalog/dynamic-form-editor-page/spec.md --base origin/feat/dynamic-forms-page --json
```

Evaluation must record the exact command, selected base `origin/feat/dynamic-forms-page`, resolved base SHA, every reported count and result. Any change to the Spec revision/path contract, base SHA, integrated changed-file set or declared path diff invalidates this row and restarts the gate before review.

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Manual | MV-01 — Consultation create/preview | AC-02, AC-05–AC-10, AC-14 | Spec MV-01 | `./evaluation.md` with real request, persistence and browser evidence | `partial` |
| Manual | MV-02 — Formalization edit/removal/lifecycle | AC-04–AC-08, AC-12, AC-13, AC-16 | Spec MV-02 | `./evaluation.md` with impact/history/lifecycle evidence | `partial` |
| Manual | MV-03 — failure/retry/stale/no-op recovery | AC-09–AC-11, AC-15 | Spec MV-03 | `./evaluation.md` with two-session and replay evidence | `pending` |
| Manual | MV-04 — 320×800 keyboard/reduced motion | AC-05, AC-08, AC-14, AC-15 | Spec MV-04 | `./evaluation.md` with trace, screenshots and console/network inspection | `partial` |
| Manual | MV-05 — admin/attendant real authorization | AC-01, AC-03, AC-15 | Spec MV-05 | `./evaluation.md` with fresh contexts, 401/403 classification and no mutation evidence | `partial` |
| Runtime | Core/REST/database integration | AC-04, AC-07, AC-09–AC-12, AC-16 | Integration Contract | `./evaluation.md` with real HTTP and persistence/authorization results | `partial` |
| Visual | Editor page — saved Consultation | AC-02, AC-08, AC-13, AC-14 | `./design/iX5sr.png` — 1440×1200 | Fresh Playwright screenshot and independent comparison in `./evaluation.md` | `pending` |
| Visual | Save bar — saved | AC-09, AC-13 | `./design/avpzp.png` — 1184×70 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | Save bar — dirty | AC-09, AC-13 | `./design/TN5wx.png` — 1184×70 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | Save bar — saving | AC-09 | `./design/Ew8qq.png` — 1184×70 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | Save bar — failure | AC-09, AC-10 | `./design/AYJ95.png` — 1184×70 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | Short-text field dialog | AC-05, AC-06, AC-14 | `./design/Z5OyY.png` — 560×550 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | Long-text field dialog | AC-05 | `./design/Sys4w.png` — 560×589 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | Date field dialog | AC-05, AC-06 | `./design/qpDOo.png` — 560×550 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | Boolean field dialog | AC-05, AC-06 | `./design/WiFpJ.png` — 560×575 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | Multiple-selection dialog/options | AC-05–AC-07 | `./design/i194Af.png` — 560×714 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | Single-selection dialog/options | AC-05–AC-07 | `./design/lmvBH.png` — 560×772 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | Integer field dialog | AC-05, AC-06 | `./design/TFlkr.png` — 560×618 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | BRL currency field dialog | AC-05, AC-06 | `./design/Mv1W8.png` — 560×618 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | Percentage field dialog | AC-05, AC-06 | `./design/hgwKf.png` — 560×618 logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | Field removal dialog | AC-12, AC-14 | `./design/Lcpwf.png` — 440×content logical | Fresh screenshot/comparison in `./evaluation.md` | `pending` |
| Visual | New/empty editor and first valid field | AC-02, AC-05 | Handoff supplemental decision — 1440×1200 | Fresh runtime screenshot and independent comparison in `./evaluation.md` | `pending` |
| Visual | Formalization editor with all nine types | AC-05, AC-06 | Handoff supplemental decision — 1440×1200 | Fresh runtime screenshot and independent comparison in `./evaluation.md` | `pending` |
| Visual | Validation errors and all-type Consultation matrix | AC-05, AC-06, AC-14 | Handoff supplemental decision — 1440×1200 | Fresh runtime screenshot and independent comparison in `./evaluation.md` | `pending` |
| Visual | Stale-version and unsaved-navigation dialogs | AC-10, AC-11 | Handoff supplemental decision — 1440×900 | Fresh runtime screenshot and independent comparison in `./evaluation.md` | `pending` |
| Visual | Narrow editor and dialogs | AC-14 | Handoff supplemental decision — 320×800 | Fresh runtime screenshot and independent comparison in `./evaluation.md` | `pending` |
| Visual | Loading/not-found/forbidden/generic failure | AC-01–AC-03, AC-15 | Handoff supplemental decision — 1440×900 | Fresh runtime screenshot and independent comparison in `./evaluation.md` | `pending` |

Final handoff requires every task and phase to be complete, current Spec commands and structural path gate evidence on the integrated commit, reviewed generated artifacts/migration, healthy services/accounts/fixtures, all MV scenarios executable, transient screenshot/trace identifiers recorded, final Spec tree/conformance comparison passed, all supplemental screenshot decisions resolved, exactly one `reviewer` completed, every verified finding resolved, and no blocking finding active. The next workflow is `conclude-spec`.
