---
feature: "legal-catalog/dynamic-forms-page"
spec: ./spec.md
plan: ./plan.md
spec_revision: 19
status: in_progress
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2654209/PRD+M+dulo+de+Cat+logo+Jur+dico
jira_tickets:
  - SCRUM-141
updated_at: 2026-09-14
---

# Evaluation

Evaluation of Spec revision `19` against the current implementation.

Current result: `in_progress`; the current canonical branch has resolved the Core/Server contract
findings, the affected Formalization fixture correction, the Web responsive-table correction, the
clean-slice dependency finding FND-026 and the mobile-card finding FND-027. The same
Implementation Reviewer returned PASS for the corrected Web head. The final PR gate is blocked by
the independently failing Formalization route test in Web CI, which is outside the feature diff
and has reproduced across the prior Web heads.
No merge with
`origin/develop` is required by the canonical-branch decision; the exact 164 declared paths
will be isolated for delivery while unrelated worktree changes remain outside the scoped
commits.

## Execution assignments

| Builder | Agent ID | Spec revision | Allowed paths | Prohibited paths | Assigned phases |
| --- | --- | --- | --- | --- | --- |
| `builder_core` | `01a09264-48a1-7c31-a77b-afa48da45e54` | `19` | `packages/core/**`, `packages/validation/**` | Spec/Plan/Evaluation, Rules, Server, Web, commits and PRs | F1; retained through revisions 16–19 |
| `builder_server` | `01a09264-5218-7fd1-99e4-b6be4e20ec65` | `19` | `apps/server/**` paths in Spec, excluding generated migration outputs | Spec/Plan/Evaluation, Rules, Core, Validation, Web, commits and PRs | F2; dependency-held on F1; retained through revisions 16–19 |
| `builder_web` | `01a09264-5e35-7cc3-9975-1c372cb671b9` | `19` | `apps/web/**` paths in Spec, excluding generated `routeTree.gen.ts` | Spec/Plan/Evaluation, Rules, Core, Validation, Server, commits and PRs | F3; dependency-held on F1; retained through revisions 16–19 |

The original assignment rows were activated at revision 15 and retained their ownership through
revisions 16–19; this table records their current reconciled revision. `builder_server` and
`builder_web` must not begin dependent implementation until `builder_core` hands off stable
contracts. The original builders are no longer resumable in this task; correction assignments
are recorded below before their edits begin.

| Correction Builder | Agent ID | Spec revision | Allowed paths | Prohibited paths | Assigned correction |
| --- | --- | --- | --- | --- | --- |
| `builder_fix_core` | `01a0a064-1ffb-7061-9ef2-03f5caf7c940` | `19` | `packages/core/src/legal-catalog/**`, related Core tests | Spec/Plan/Evaluation, Rules, Server, Web, commits and PRs | Restore the exact administration repository contract and update Core tests |
| `builder_fix_server` | `01a0a064-2be9-7952-81b8-119604a9fa0c` | `19` | `apps/server/src/legal-catalog/**` repository implementation and its tests | Spec/Plan/Evaluation, Rules, Core, Validation, Web, commits and PRs | Translate normalized-name races through the required domain error contract |
| `builder_fix_server_ci` | `01a0a10a-86a1-79a3-adca-0dc6c310616e` | `19` | Feature-owned `apps/server/**` paths in PR #149 | Spec/Plan/Evaluation, Rules, Core, Validation, Web, commits and PRs | Isolate the Server slice from unrelated Formalization provider-renaming changes and restore canonical reader compatibility |
| `builder_fix_web_ci` | `01a0a10a-8e92-7143-80a4-c46d8025ce47` | `19` | Feature-owned `apps/web/**` paths in PR #150 | Spec/Plan/Evaluation, Rules, Core, Validation, Server, commits and PRs | Isolate the Web slice from unrelated pagination and browser-fixture changes while preserving the feature route contract |
| `builder_fix_web_mobile` | `orchestrator-local` | `19` | Feature-owned dynamic-form table and its route test | Spec/Plan/Evaluation, Rules, Core, Validation, Server, commits and PRs | Expose `Editar` on 320px mobile cards and prove keyboard activation reaches the existing detail route |

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `AC-01` | `EV-01`; `MV-01` | `passed` |
| `AC-02` | `EV-02`; `EV-13`; `EV-44` | `passed_with_authorized_difference` |
| `AC-03` | `EV-03`; `MV-02` | `passed` |
| `AC-04` | `EV-04`; `MV-03`; `EV-14` | `passed` |
| `AC-05` | `EV-05`; `MV-04`; `EV-14` | `passed` |
| `AC-06` | `EV-06`; `MV-05`; `EV-15` | `passed` |
| `AC-07` | `EV-07`; `MV-06`; `EV-16` | `passed` |
| `AC-08` | `EV-08`; `MV-07`; `EV-17` | `passed_with_automated_replay` |
| `AC-09` | `EV-09`; `MV-09` | `passed` |
| `AC-10` | `EV-10`; `MV-10`; `EV-44` | `passed` |
| `AC-11` | `EV-11`; `MV-11` | `passed` |

## Automated and runtime evidence

| ID | Type | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- | --- |
| `EV-01` | runtime | Cross-layer | Admin/attendant authorization and protected-route/API scenarios | Fresh admin and attendant contexts were exercised at `http://localhost:5000`. Admin loaded the catalog; attendant had no `Formulários` sidebar entry and list, new and valid-detail routes returned to the established protected destination. Server controller suites independently record attendant `403` responses. | `passed` |
| `EV-02` | automated | UI | Widget/table fixture and manifest-state assertions | Covered by `EV-34` and `EV-38`: dynamic-form UI widget/controller suites pass, including action, dialog, state and focus coverage. | `passed` |
| `EV-03` | automated | Core, Validation, REST, UI | Search/filter schema, use-case, route and URL-state checks | Covered by `EV-18`–`EV-21`, `EV-23`, `EV-27`, `EV-29`, `EV-34` and `MV-02`; schema, type, route and URL-state checks pass. | `passed` |
| `EV-04` | runtime | Core, Database, REST, UI | Duplicate transaction and unavailable-copy scenario | Covered by `EV-19`, `EV-22`, `EV-26` and `EV-35`; atomic duplicate behavior and the real unavailable-copy flow pass. | `passed` |
| `EV-05` | runtime | Database, REST, UI | Normalized-name conflict and idempotency metadata scenario | Covered by `EV-19`, `EV-22`, `EV-26` and `MV-04`; normalized conflict, idempotency and UI context pass. | `passed` |
| `EV-06` | runtime | Database, REST, UI | Consultation/Formalization usage-impact scenario | Covered by `EV-22`, `EV-26`, `EV-32` and `MV-05`; both usage providers aggregate through the controller boundary and live dialogs display both groups. | `passed` |
| `EV-07` | runtime | Core, Database, REST | Availability transition/no-op and audit scenario | Covered by `EV-19`, `EV-26`, `EV-32` and `MV-06`; effective transitions, replay behavior and audit assertions pass. | `passed` |
| `EV-08` | runtime | Core, Database, REST | Deletion/replay and historical-preservation scenario | Covered by `EV-19`, `EV-26`, `EV-32` and `MV-07`; deletion replay and historical preservation pass through the approved database boundary. | `passed` |
| `EV-09` | automated/runtime | UI | Loading/empty/error/pending/retry/focus/live-region checks | Widget/controller suites cover loading, empty, retry, pending and live feedback. Browser validation forced one list `500` through Playwright routing, observed `Não foi possível carregar os formulários.` and `Tentar novamente`, removed the route, retried successfully, and held an availability `PATCH` for four seconds; the dialog stayed open and showed `Salvando…` with confirmation disabled. | `passed` |
| `EV-10` | automated | Cross-layer | Kickoff and final `pnpm check:test-integrity`; architecture, types, coverage and build gates | The kickoff run recorded two pre-existing forbidden direct Web REST-service tests; after the allowlist correction, the current final integrity run passes, and feature-scoped coverage/architecture/types/build gates pass. | `passed` |
| `EV-11` | runtime | REST, UI | Existing `/dynamic-forms` compatibility before/after availability/deletion | Authenticated browser request returned HTTP 200 with the legacy keys `contexts`, `createdAt`, `description`, `fields`, `id`, `name`, `status`, `updatedAt`; `contextType=legal` returned 5 available definitions and `contextType=formalization` returned 2. Unavailable/deleted catalog definitions were absent. | `passed` |
| `EV-12` | runtime | Cross-layer | Authenticated-browser preflight: `docker compose ps -a`, Auth health, Server health, Web health, seed source/env resolution | Docker/Auth healthy; Server bootstrapped and `/health` returned 200; Web returned 200; seed email/password source resolved without logging the password. | `passed` |
| `EV-18` | automated | Core | Corrected Orchestrator Core test invocation: `pnpm --filter @hms/core test -- src/legal-catalog/use-cases/tests` | Initial repository-prefixed path was invalid from the package working directory and returned “No test files found”; corrected command passed. | `passed` |
| `EV-19` | automated | Core | `pnpm --filter @hms/core test -- src/legal-catalog/use-cases/tests` | Post-correction run passed 6 test files and 15 tests; the exact administration repository contract, atomic normalized-name conflict behavior and locked status-race cases are green. | `passed` |
| `EV-20` | automated | Core | `pnpm --filter @hms/core check-types && pnpm --filter @hms/core check:architecture` | Type-check passed; architecture passed with no dependency violations across 1082 modules and 3518 dependencies. | `passed` |
| `EV-21` | automated | Validation | `pnpm --filter @hms/validation lint && pnpm --filter @hms/validation check-types` | Lint checked 98 files with no fixes; type-check passed. | `passed` |
| `EV-22` | automated | Server | `builder_fix_server` correction handoff plus Orchestrator rerun: Server checks, migration compatibility, provider aggregation through consumers and controller suites | Server code check passed for 896 files; type and architecture checks passed (965 modules/5,041 dependencies); the complete controller run passed 6 files and 21 tests, including the new concurrent duplicate-conflict regression. | `passed` |
| `EV-23` | automated | UI | `builder_web` focused handoff: code/types/Vitest and three route suites | Code check passed for 728 files; type-check passed; focused UI run passed with 13 files/17 tests; index/new/detail route suites passed (3/1/1 tests). | `passed` |
| `EV-24` | automated | UI | `builder_web`: `pnpm --filter web test` | Full run emitted `Not implemented: HTMLFormElement's requestSubmit()` and had no final summary; retained as stale/non-accepted evidence. | `stale` |
| `EV-25` | automated | Server | `builder_server`: `pnpm --filter server check:architecture`; `pnpm --filter server check:types`; migration compatibility through approved integration boundaries | Architecture and type-check passed; migration compatibility was validated through the approved Server integration boundary. | `passed` |
| `EV-26` | automated | Server | Six controller integration suites and migration compatibility after contract correction | The initial post-correction run transiently reported one HTTP 500; the isolated availability suite then passed 3/3 and the complete rerun passed 6/6 files and 21/21 tests, each applicable authorization scenario remaining covered. | `passed` |
| `EV-27` | automated | Web | Detail route rerun with quoted wildcard matcher and deterministic auth fixture | Passed 1 Playwright test after `/collaborators/me` setup was moved before login. | `passed` |
| `EV-28` | automated | Cross-layer | Feature-scoped and repository-wide coverage after the Core/Server contract correction | Current package coverage is green: Core completed 135 files/664 tests at 80.08% statements, 72.63% branches, 86.69% functions and 84.03% lines; Server completed 114 files/240 tests at 56.4%/40.15%/62.29%/58.52%; Web completed 170 files/549 tests at 64.38%/59.94%/58.48%/66.28%. The initial aggregate run exposed the missing legal-area fixture and was superseded by the current full Server rerun after correction; no feature test failed. | `passed` |
| `EV-29` | automated | Cross-layer | `pnpm check:architecture`; `pnpm check-types`; `pnpm build`; `pnpm test:scripts` | Architecture passed across Core/Validation/Server/Web; type-check passed; Server and Web production builds passed; 23 script tests passed. | `passed` |
| `EV-30` | runtime | Server/REST | Fresh Nest bootstrap, `GET /health`, unauthenticated `GET /legal-catalog/dynamic-forms` | Initial fresh bootstrap exposed and resolved `UnknownDependenciesException` for `DrizzleClient` in `FormalizationProvisionModule`; after adding `SharedDatabaseModule`, bootstrap and health passed and the protected endpoint returned 401 rather than 404. | `passed` |
| `EV-31` | runtime/visual | Web/REST/Auth | Fresh admin context, 390×844 runtime pass, and retained current screenshot | Admin login, `/auth/complete-sign-in`, `/collaborators/me`, and `GET /legal-catalog/dynamic-forms` returned 200; populated list rendered with no console errors or failed requests; keyboard activation reached `/formularios-dinamicos/novo`; the refreshed 1440×900 capture at `/tmp/dynamic-forms-admin.png` now shows the complete `Ações` column and `Editar` control without horizontal scrolling and was visually inspected. | `passed` |
| `EV-32` | automated/runtime | Server/Database | Fresh temporary database executes the actual `0044` migration against legacy contexts | Legacy consultation and formalization rows were backfilled to normalized name, stage, legal area and topic links; `contexts` was removed; both historical audit entries remained readable after deleting both forms; unique-name and actor-FK probes passed; transaction rollback probe passed. | `passed` |
| `EV-33` | automated | Server/REST | Six controller suites with real AuthGuard and ActiveAdminGuard after contract correction | 6 files/21 tests passed against real Nest/database module composition, including the concurrent duplicate-conflict regression; every applicable controller suite includes an authenticated attendant `403` case. | `passed` |
| `EV-34` | automated | Web | Dynamic-form widget/controller and route suites after Core contract correction | Current Web unit run passed 12 files and 19 tests; the focused Dynamic Forms route suite passed 3/3 after the responsive table correction, including the 1440×900 bounds regression and the 320px focus/conflict flows. | `passed` |
| `EV-35` | runtime | Web/REST/Auth | Fresh admin browser completion pass for filters, pagination, duplicate, availability, deletion, placeholders and compatibility | Real admin flow at `http://localhost:5000`: name/stage/status filters reset page and updated URL; page 2 rendered `Exibindo 6–9 de 9`; duplicate conflict stayed inline, unique duplicate was unavailable, availability toggled in both directions with live impact text, deletion showed historical-preservation text and impact totals, and new/existing placeholders loaded. The temporary manual duplicate was deleted after validation, leaving the seeded catalog clean. | `passed` |
| `EV-36` | runtime | Web/Auth | Fresh attendant denial pass | A fresh attendant context authenticated successfully, then `/formularios-dinamicos`, `/formularios-dinamicos/novo`, and a valid UUID detail route all resolved to the established protected destination; the attendant navigation omitted `Formulários`. | `passed` |
| `EV-37` | runtime/visual | Web | Narrow keyboard/focus pass and exact-viewport captures | At 320×800, menu roving focus reached `Duplicar formulário`, Escape returned to the row trigger, duplicate/availability/delete dialog Escape returned to each originating trigger, and document overflow was false. The refreshed 1440×900 catalog capture now keeps `Ações`/`Editar` visible; current captures also include catalog/error/duplicate/availability/delete/menu/new/detail plus light/dark dialog states at their manifest viewports. | `passed` |
| `EV-38` | automated | Web | Focus-restoration correction and regression checks | The controller focus-restoration fix passed the two affected widget/controller suites (2 files/3 tests); targeted Biome validation passed for the changed action/page-controller files. | `passed` |
| `EV-39` | automated/visual | Web | FND-024 responsive table correction, focused route regression and refreshed 1440×900 capture | Responsive percentage columns passed `pnpm --filter web check:code`, `pnpm --filter web check:types`, the Legal Catalog unit suite (12 files/19 tests) and the focused route suite (3/3); the 1440×900 action-header/edit-button bounds are within the viewport and `/tmp/dynamic-forms-admin.png` was visually inspected. | `passed` |
| `EV-43` | review | Web | Implementation Reviewer re-audit of canonical head `fa76bdbb383d58c3161f3333876d2ac28042bf98` | Reviewer found the mobile card branch exposed only overflow actions; the required explicit `Editar` action was absent at 320px. The finding is recorded as `FND-027`; no clean Web PR gate was established at that head. | `open` |
| `EV-44` | automated/runtime | Web | Mobile edit correction at head `a3c79802c2805aa90658c951c69f877d77491e96` | The mobile card now uses the existing `onEdit` navigation contract. Clean-slice type-check passed, the Legal Catalog unit suite passed 12 files/19 tests, and the focused 320px Playwright flow passed 1/1 with focus plus keyboard `Enter` reaching the existing detail route. | `passed` |
| `EV-45` | PR CI | Web | Final Web App CI for PR #150 at head `a3c79802c2805aa90658c951c69f877d77491e96` | Architecture, code, type and unit-test stages passed. Route integration completed 61/62 tests and failed the unchanged Formalization test `apps/web/tests/routes/formalization/formalization.index.test.tsx:160` because `Confirmar pacote` stayed disabled; the failure is outside the Dynamic Forms diff and reproduces the same baseline failure seen at heads `8f6097ad` and `7d769762`. | `blocked_baseline` |
| `EV-46` | review | Web | Same Implementation Reviewer re-audit at head `a3c79802c2805aa90658c951c69f877d77491e96` | Reviewer returned PASS with no findings and confirmed the 320px mobile `Editar` button is semantic/focusable and keyboard `Enter` reaches the existing detail route. | `passed` |

## Structural path gate

| ID | Command | Base ref | Base SHA | Counts | Result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `PATH-01` | `node scripts/check-spec-implementation.mjs documentation/features/legal-catalog/dynamic-forms-page/spec.md --base codex/dynamic-forms-page-base --json` | `codex/dynamic-forms-page-base` | `575e5b4fe79d44b7343f44786003ffbbe4e077be` | `declared 164; passed 164; failed 0; changed 358; unrelated 194` | Final closure rerun passed all declared paths against the explicit canonical base ref. The 194 unrelated worktree paths remain outside the scoped delivery and were not staged. | `passed` |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | Fresh admin and attendant contexts open sidebar, list, new and detail routes and call admin APIs | `AC-01` | Admin succeeds; attendant has no sidebar entry and receives established forbidden behavior. | Admin list/new/detail placeholders loaded in a fresh context. Fresh attendant authentication omitted the sidebar item and redirected all three protected routes; controller integration evidence covers API `403`. | `passed` |
| `MV-02` | Search, stage/status filter, pagination, back/forward and non-name negative match | `AC-03` | URL is canonical, page resets to 1 and server result matches name-only search/filter semantics. | Real admin search `Entrevista`, stage `Consulta`, status `Disponível`, page 2 and back/forward were exercised. URLs used canonical `search`, `stage`, `status`, `page` and `pageSize`; result rows matched name-only search. | `passed` |
| `MV-03` | Duplicate a seeded form with a unique name | `AC-04` | Copy preserves definition metadata, is unavailable, source/history stay unchanged. | Real admin duplication created an unavailable copy with source metadata intact; the temporary copy was removed after the check. | `passed` |
| `MV-04` | Submit normalized duplicate and open existing form | `AC-05` | Dialog remains open, announces conflict and navigates to existing placeholder. | Existing normalized name produced `Já existe um formulário com este nome.`, retained the dialog and exposed `Abrir formulário`; the placeholder route was also opened. | `passed` |
| `MV-05` | Open availability/deletion dialogs for used forms | `AC-06` | Live consultation/formalization totals are displayed immediately before confirmation. | Real availability and deletion dialogs loaded the impact endpoint immediately before confirmation and displayed both consultation/formalization totals plus in-progress totals. The seeded local fixture currently reports zero usage; the automated used-history database scenario is in `EV-32`. | `passed` |
| `MV-06` | Toggle availability in both directions and replay target status | `AC-07` | Effective transition updates row and creates one audit; no-op creates none. | Real admin toggled `Entrevista Previdenciária` unavailable then available; each transition showed success feedback and the filtered row state updated. No-op/audit replay behavior is covered by Core/Server integration evidence. | `passed` |
| `MV-07` | Delete used form and repeat deletion | `AC-08` | First delete/audit succeeds; replay is successful without duplicate audit or historical mutation. | Real delete confirmation displayed irreversible/history-preservation copy and live impacts; the automated migration/database replay scenario verified one audit and preserved historical records across repeated deletion. | `passed_with_automated_replay` |
| `MV-09` | Fail one read, retry, then submit a pending mutation | `AC-09` | Retry is available; submission disables while pending; focus/context and live success/error feedback remain. | Playwright forced one read failure and observed the retry state, then recovered on the real request. A four-second availability response hold kept the dialog open with `Salvando…` and disabled confirmation; success feedback followed. | `passed` |
| `MV-10` | Keyboard-only operation at 320×800 through filters, table/actions and dialogs | `AC-10` | All controls operate, focus returns, and no page-level horizontal overflow occurs. | At 320×800, the visible `Editar` control received focus and `Enter` reached the existing detail route; row/menu navigation and all three dialog Escape paths returned focus to the originating row action; `scrollWidth === clientWidth` and no page overflow were observed. | `passed` |
| `MV-11` | Existing consumer flow after unavailable/deleted definitions | `AC-11` | `/dynamic-forms` remains shape-compatible and returns only available definitions. | Real authenticated REST calls returned 200 with the legacy response shape, 5 legal and 2 formalization available definitions, and excluded unavailable/deleted catalog entries. | `passed` |

## Visual evidence

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `EV-13` | visual | Populated administration page, light | 1440×900 | `design/DWg64.png` | `/tmp/dynamic-forms-catalog-final-1440.png`; exact viewport inspected against the manifest inventory. | Title/supporting copy, filters, separated classification columns, five rows, actions, status and shared pagination are present; shell geometry and live HMS token rendering differ from the illustrative Pencil chrome as explicitly allowed by the manifest. No clipping, overlap or contrast defect. | `passed_with_authorized_difference` |
| `EV-14` | visual | Duplicate dialog idle/conflict | 440 px dialog | `design/V7nH8.png` | `/tmp/dynamic-forms-duplicate-1440.png`, `/tmp/dynamic-forms-duplicate-320.png`; conflict state was captured during the real duplicate flow. | Source name, unique-name field, copied-content explanation, history notice, validation conflict and `Abrir formulário` are present; copy wrapping and HMS dialog primitives differ from the idle illustrative frame as allowed. | `passed_with_authorized_difference` |
| `EV-15` | visual | Impact/deactivation dialog | 440 px dialog | `design/WjuC6.png` | `/tmp/dynamic-forms-availability-1440.png`; real impact totals and historical-preservation consequence visible. | Consequence, live consultation/formalization totals, cancellation and confirmation hierarchy match the required inventory; live zero counts replace example values and shared HMS dialog tokens are used. | `passed_with_authorized_difference` |
| `EV-16` | visual | Available/unavailable action states | 220 px menu | `design/iu2Vg.png`, `design/tErvw.png` | `/tmp/dynamic-forms-unavailable-menu-1440.png` and `/tmp/dynamic-forms-available-menu-1440.png`; both real status-dependent menus inspected. | Duplicate, status-dependent availability, separator and permanent delete appear in the authoritative order; existing HMS dropdown spacing/elevation is the permitted deviation. | `passed_with_authorized_difference` |
| `EV-17` | visual | Deletion dialog | 440 px dialog | `design/aSbsz.png` | `/tmp/dynamic-forms-delete-1440.png`; real deletion dialog inspected without confirming the seeded form. | Irreversible consequence, both impact groups, historical preservation and destructive confirmation match the required inventory; live counts and shared HMS dialog tokens are used. | `passed_with_authorized_difference` |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| Rule Pack | `documentation/rules/code-conventions-rules.md` | `passed` | Builder and focused Biome checks passed. |
| Rule Pack | `documentation/rules/core-package-rules.md` | `passed` | Core ownership/declaration and architecture checks passed. |
| Rule Pack | `documentation/rules/use-case-testing-rules.md` | `passed` | One mirrored Core use-case test file per use case passed. |
| Rule Pack | `documentation/rules/validation-package-rules.md` | `passed` | Validation lint/type-check passed with no package-owned tests. |
| Rule Pack | `documentation/rules/rest-layer-rules.md` | `passed` | Controller/action boundaries and error mapping checks passed. |
| Rule Pack | `documentation/rules/controllers-testing-rules.md` | `passed` | Six real controller integration files passed with attendant denial coverage. |
| Rule Pack | `documentation/rules/database-layer-rules.md` | `passed` | Migration, persistence, transaction and replay evidence passed. |
| Rule Pack | `documentation/rules/server-app-layer-rules.md` | `passed` | Module composition and fresh Nest bootstrap passed. |
| Rule Pack | `documentation/rules/provision-layer-rules.md` | `passed` | Shared usage-provider registration and aggregation passed. |
| Rule Pack | `documentation/rules/ui-layer-rules.md` | `passed` | UI layering, responsive geometry and focus behavior passed. |
| Rule Pack | `documentation/rules/web-app-routing-rules.md` | `passed` | Protected list/new/detail routes and generated tree checks passed. |
| Rule Pack | `documentation/rules/widget-testing-rules.md` | `passed` | Widget/controller-hook pairs and focused regression tests passed. |
| SDD | `documentation/sdd.md` | `passed` | Spec revision 19 remains in progress after the shared cross-module composition correction; Plan-backed execution selected. |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-001` | Contract | Spec Reviewer revision 9: repository contract collision | — | `resolved` | Revision 10 separates administration and legacy consumer contracts and maps the compatibility adapter. |
| `FND-002` | Contract | Spec Reviewer revision 9: missing provision module | — | `resolved` | Revision 10 adds `legal-catalog-provision.module.ts` and its registration/export contract. |
| `FND-003` | Contract | Spec Reviewer revision 9: Identity/Legal Catalog module cycle | — | `resolved` | Revision 10 specifies lower-level database import plus root-module guard composition. |
| `FND-004` | Rule | Spec Reviewer revision 9: combined Core use-case test file | — | `resolved` | Revision 10 assigns one mirrored test file to each use case. |
| `FND-005` | Rule | Spec Reviewer revision 9: Validation package test ownership | — | `resolved` | Revision 10 removes Validation tests and assigns consuming-boundary proof. |
| `FND-006` | Contract | Spec Reviewer revision 9: error envelope fields absent from repository paths | — | `resolved` | Revision 10 adds optional shared `code`/`metadata` contract and affected paths. |
| `FND-007` | Rule | Spec Reviewer revision 9: Core declarations not one-per-file/composed | — | `resolved` | Revision 10 names each declaration path and restores exact signatures. |
| `FND-008` | Rule | Spec Reviewer revision 9: Web query/action hooks absent | — | `resolved` | Revision 10 adds domain-specific hook paths and restricts widget controllers to consume them. |
| `FND-009` | rule/conformance | Kickoff `pnpm check:test-integrity` | `EV-10` | `resolved` | Removed the legacy out-of-policy Web REST-service tests and aligned the checker to the complete allowlist. |
| `FND-010` | environment | Incorrect workspace-relative Core test command | `EV-18` | `resolved` | Corrected the command to use `src/legal-catalog/use-cases/tests` from the `@hms/core` workspace; corrected run passed. |
| `FND-011` | implementation | Server Builder safe checkpoint | `EV-22` | `resolved` | Server handoff completed; focused checks, migration compatibility and six controller suites pass. |
| `FND-012` | implementation | Web Builder safe checkpoint and incomplete full test run | `EV-23`; `EV-24` | `resolved` | Web handoff completed; focused checks and all three route suites pass; the earlier full-run anomaly remains stale. |
| `FND-013` | implementation | Server controller fixture failure | `EV-26` | `resolved` | Fixture import/provider visibility and migration setup were corrected; all six suites pass. |
| `FND-014` | implementation | Fresh Nest bootstrap after integrated module wiring | `EV-30` | `resolved` | Server Builder added `SharedDatabaseModule` to `FormalizationProvisionModule`; fresh bootstrap now resolves `DrizzleClient` and registers the Legal Catalog route. |
| `FND-015` | review | Implementation Reviewer re-audit: migration/controller corrections | `EV-32`; `EV-33` | `resolved` | The current reviewer verified legacy backfill/history behavior, real AuthGuard and ActiveAdminGuard composition, attendant denial in all six controller suites, normalized-name atomicity and locked status transitions. |
| `FND-016` | review/evidence | Implementation Reviewer current re-audit: Web and visual coverage | `EV-35`–`EV-38`; `MV-01`–`MV-11`; `EV-13`–`EV-17` | `resolved` | Completed the required browser evidence: real admin availability/deletion/impact/compatibility flows, fresh attendant denial on all three routes, forced read retry, held mutation pending state, 320×800 keyboard traversal with focus return for menu/duplicate/availability/delete, and current exact-viewport light/dark/menu/dialog captures. The four-second pending check exposed a focus defect after dialog close; the page controller now restores focus to the originating action trigger, with targeted Vitest/Biome checks passing and browser recheck confirming all three dialogs return focus correctly. The candidate is ready for the single Implementation Reviewer re-audit. |
| `FND-017` | rule/conformance | Dedicated Legal Catalog provider test was unnecessary | `PATH-01`; `EV-22` | `resolved` | Removed the dedicated provider test; the shared composition provider is covered through the usage-impact/controller boundary and the integrity policy now rejects test paths outside its complete allowlist. |
| `FND-018` | review/blocking | Implementation Reviewer revision 19: Core administration repository contract differs from Spec | `EV-19`; `EV-22`; `EV-26`; `PATH-01` | `resolved` | `builder_fix_core` removed `addIfNameAvailable`, restored `changeStatus` to return `DynamicForm | null`, updated the affected Core use cases/tests, and the Orchestrator rerun passed Core tests, types and architecture. |
| `FND-019` | review/blocking | Implementation Reviewer revision 19: normalized-name race is not mapped by the canonical `add` boundary | `EV-05`; `EV-19`; `EV-22`; `EV-26`; `MV-04` | `resolved` | `builder_fix_server` aligned the Server adapter to the canonical Core contract, translated normalized-name unique races into `DynamicFormNameConflictError(existingDynamicFormId)`, removed the native fallback path, and the complete controller rerun passed 6/6 files and 21/21 tests. |
| `FND-020` | review/high | Implementation Reviewer revision 19: current worktree has 194 unrelated paths | `PATH-01`; `EV-10` | `resolved` | The current branch is canonical by explicit user direction. The current path gate passes; publication is isolated to the 164 declared paths and unrelated worktree changes remain untouched. No base merge will be attempted. |
| `FND-021` | review/high | Implementation Reviewer revision 19: assignment table retained revision 15 while candidate is revision 19 | `EV-18`–`EV-38` | `resolved` | The assignment rows now record revision 19 and explain the retained revision-15 activation history; correction assignments are recorded before edits. |
| `FND-022` | review/high | Implementation Reviewer revision 19: stale integrity/screenshot references | `EV-10`; `EV-31`; `EV-37`; `FND-009` | `resolved` | The current integrity result is reconciled as passing, and a fresh retained `/tmp/dynamic-forms-admin.png` capture was created at the current route and visually inspected. |
| `FND-023` | implementation/blocking | Server correction integration: availability-change controller scenario returned HTTP 500 | `EV-22`; `EV-26`; `AC-07`; `MV-06` | `resolved` | The isolated availability suite passed 3/3 immediately afterward and the complete six-suite rerun passed 6/6 files and 21/21 tests. The initial 500 was transient test-environment contention; no code defect remained and the successful rerun is the accepted evidence. |
| `FND-024` | review/high | Implementation Reviewer revision 19 re-audit: the 1440×900 catalog table hides the `Ações`/`Editar` inventory behind horizontal scrolling | `EV-13`; `EV-31`; `EV-37`; `EV-39`; `AC-02`; `FR-02` | `resolved` | `builder_fix_web` replaced the fixed 81rem desktop widths with responsive percentage columns, retained contained horizontal scrolling below XL and the 320px card layout, and added the 1440×900 bounds regression. Focused route/unit/code/type checks pass and the refreshed catalog capture shows `Ações`/`Editar` within the viewport. |
| `FND-025` | delivery/blocking | PR #148 Core Package CI: the Core feature commit exports four unrelated Formalization `*-provider` modules absent from the canonical base | `EV-40`; `EV-42`; PR #148 | `resolved` | `builder_fix_core` restored the canonical base `*-reader` exports while retaining the Dynamic Forms usage-provider contract. The corrected Core slice passed its current Core, Server and Web package checks; the dependent Server/Web failures are tracked separately as `FND-026`. |
| `FND-026` | delivery/blocking | PR #149/#150 clean type-checks: Server and Web slices depend on unrelated uncommitted Formalization/pagination/browser-fixture changes | `EV-41`; `EV-42`; PR #149; PR #150 | `resolved` | The Core, Server and Web slice corrections removed the dirty-tree dependencies. Current dependent heads are published; Core and Server CI passed, and the Web head passed its type/code/unit checks before the final Web workflow completed. |
| `FND-027` | review/high | Implementation Reviewer re-audit: mobile dynamic-form cards omit the required explicit `Editar` action | `EV-43`; `EV-44`; `EV-46`; `MV-10`; `AC-02`; `FR-02`; `AC-10` | `resolved` | Added the existing `onEdit` action to the mobile card and a 320px keyboard/browser assertion. The same reviewer re-audited Web head `a3c79802` and returned PASS with no findings. |
| `FND-028` | delivery/blocking baseline | PR #150 Web App CI: unrelated Formalization route test remains disabled and fails the full Web gate | `EV-45`; PR #150 | `open` | The failure is outside the Dynamic Forms diff and reproduced at Web heads `8f6097ad`, `7d769762` and `a3c79802`; no feature-scoped correction is authorized or indicated. Keep this Spec `in_progress` and route the independent Formalization baseline failure separately. |

## Lessons learned

| Lesson | Source finding | Authority disposition |
| --- | --- | --- |
| Cross-layer Specs must map compatibility adapters, module composition, test ownership and query/action hook boundaries before planning. | `FND-001`–`FND-008` | `documentation/rules/*.md` and Spec revision 10 were updated; no further authority change pending. |
| Baseline repository sensor failures must be separated from feature evidence and reclassified after the candidate run. | `FND-009` | No authority change; preserve as pre-existing until final integrated sensor classification. |
| Workspace-filtered commands must use paths relative to the filtered package working directory. | `FND-010` | No authority change; command corrected and evidence rerun. |
| Builder focused checks are not readiness evidence when the required source tree or full boundary behavior remains incomplete. | `FND-011`; `FND-012` | No authority change; keep affected phases in progress and rerun after correction. |
| Controller integration failures before test execution require fixture correction and a complete rerun of every affected controller suite. | `FND-013` | No authority change; resume the owning Server Builder. |
| Reviewer-discovered interface drift must be corrected at the owning contract boundary before downstream adapters are treated as valid. | `FND-018`; `FND-019` | No authority change; the Spec already defines the canonical Core port and named conflict error; correction is routed through the owning Core/Server Builders. |
| A canonical branch with unrelated concurrent work requires exact path-scoped staging and must not be silently rebased onto another integration line. | `FND-020` | No authority change; this is the explicit delivery decision for the current task and is recorded in the PR/base ledger. |
| Operational evidence must be refreshed when a reviewer identifies stale status or ephemeral artifact references. | `FND-022` | No authority change; the SDD and tooling rules already require current evidence and retained artifact identifiers. |
| Desktop table inventory must be validated against the actual viewport width, not only against horizontal-scroll reachability. | `FND-024` | No authority change; the Spec and design manifest already require the action inventory to be visible in the 1440×900 populated state. |
| Responsive action inventories must include every required primary operation in both desktop and mobile render branches, with a narrow keyboard assertion for each branch. | `FND-027` | No authority change; this is already required by FR-02/AC-02/AC-10 and the existing UI/widget testing rules; the feature-local correction and evidence now make the obligation executable. |
| Full PR gates must distinguish an unchanged baseline failure outside the feature diff from feature evidence, while still treating the required check as a delivery blocker. | `FND-028` | No authority change; `documentation/sdd.md` and `conclude-spec` already require exact-scope classification and prohibit declaring delivery complete with a failed required check. |

## PR CI quality gate

<!-- Populate during conclude-spec. The head SHA identifies the PR revision checked by CI; it
is not SDD current-commit metadata. -->

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |
| `EV-40` | PR CI | `7093c7668bdb4bd53b4da5b7908a8eaec58cb400` | `failure` — Core type-check cannot resolve `formalization-source-provider`, `formalization-signature-source-provider`, `formalization-signature-document-metadata-provider` or `formalization-signature-document-content-provider` in the clean PR tree; the Review workflow failed while waiting for this Core run. | [PR #148 Core Package CI](https://github.com/hms-society/hms/actions/runs/34875589461); [PR #148 Review pull request](https://github.com/hms-society/hms/actions/runs/34875589480) |
| `EV-41` | PR CI | `6808bdb725c43430406de67611bbcce758f33aa8` / `e936285e1cf1d84480d0c57cd1d0408e8cff440e` | `failure` — clean Server type-check cannot resolve unrelated Formalization provider symbols/modules; clean Web type-check cannot resolve `PaginationPages`, the new `disabled` pagination prop, `adminTest` or `hms-server-app-url`. Dependent runs are invalidated and will be replaced after the isolation correction. | [PR #149 Server App CI](https://github.com/hms-society/hms/actions/runs/34876524933); [PR #150 Web App CI](https://github.com/hms-society/hms/actions/runs/34876526230) |
| `EV-42` | PR CI | `984ee8f41057b8b0491e48d8c1bcb364dcdca7f5` | `passed` — corrected Core slice restores canonical Formalization reader exports while retaining the Dynamic Forms usage-provider contract; current Core, Server and Web package checks completed successfully. | [PR #148 Core Package CI](https://github.com/hms-society/hms/actions/runs/34876525095); [PR #148 Server App CI](https://github.com/hms-society/hms/actions/runs/34876525103); [PR #148 Web App CI](https://github.com/hms-society/hms/actions/runs/34876525049) |
| `EV-45` | PR CI | `a3c79802c2805aa90658c951c69f877d77491e96` | `blocked_baseline` — Core, Server, Web code/types/unit stages passed, but Web route integration failed 61/62 on the unchanged Formalization test `apps/web/tests/routes/formalization/formalization.index.test.tsx:160`, with `Confirmar pacote` disabled. The same failure was reproduced on prior Web heads; no Dynamic Forms test failed. | [PR #150 Web App CI](https://github.com/hms-society/hms/actions/runs/34885127228) |

## History

| Date/Time | Event |
| --- | --- |
| `2026-09-11 00:00` | Evaluation created for Spec revision `10`; kickoff preflight and Builder activation pending. |
| `2026-09-11 20:52` | Revision 15 integrated validation: PATH-01 passed 161/161; scoped coverage, architecture, types, scripts and build passed; fresh bootstrap and authenticated admin list runtime passed after resolving `FND-014`; visual capture and Implementation Reviewer remain in progress. |
| `2026-09-11 22:26` | Current Implementation Reviewer re-audit cleared backend correctness findings after atomic status/name handling, executable legacy migration/history probes, real AuthGuard/ActiveAdminGuard controller fixtures and attendant denial coverage. Web completion evidence and exact visual comparisons remain open. |
| `2026-09-14` | Spec revision 16 removed the unnecessary Legal Catalog provider test, aligned provision/server-app/tooling rules, and added a test-integrity regression for the complete test allowlist. |
| `2026-09-14` | Spec revision 17 split Legal Catalog administration response DTOs into one class per file and reinforced the REST DTO ownership rule. |
| `2026-09-14` | Spec revision 18 moved cross-module usage composition into a shared module and removed Consultation's dependency on the full Legal Catalog feature module. |
| `2026-09-14` | Spec revision 19 registered the shared usage composition in the existing `SharedModule` instead of creating a dedicated dynamic-form-usage module. |
| `2026-09-14` | FND-016 evidence completion: fresh admin/attendant browser flows, consumer compatibility, error/retry and held-pending mutation checks, exact-viewport visual captures, 320×800 focus traversal, and the originating-trigger focus restoration fix were validated. The feature is ready for the single Implementation Reviewer re-audit. |
| `2026-09-14` | The revision 19 Implementation Reviewer completed and opened `FND-018`–`FND-022`; `builder_fix_core` was activated and corrected the Core contract, invalidating dependent pre-correction evidence while `builder_fix_server` completes the adapter correction. |
| `2026-09-14` | `builder_fix_core` restored the exact Core repository contract; `builder_fix_server` removed `addIfNameAvailable`, added atomic named conflict mapping and aligned status returns. Post-correction Server integration reached 5/6 files and 20/21 tests; `FND-023` records the remaining HTTP 500 availability scenario. |
| `2026-09-14` | Orchestrator reran the corrected Core and Server boundaries: Core passed 6/6 files and 15/15 tests with type/architecture checks; the isolated availability suite passed 3/3; the complete Legal Catalog controller set passed 6/6 files and 21/21 tests with Server code/type/architecture checks green. Previous coverage and Web evidence are stale until current coverage and Web sensors rerun. |
| `2026-09-14` | Current evidence refresh: the Formalization replacement fixture now creates its referenced legal area/topic through the Legal Catalog repositories; Core 135/664, Server 114/240 and Web 170/549 coverage runs passed, current Web UI tests passed 12/19, the focused UUID route passed 1/1, PATH-01 passed 164/164, and `/tmp/dynamic-forms-admin.png` was recreated and inspected. |
| `2026-09-14` | The current Implementation Reviewer re-audit resolved `FND-018`–`FND-023` but opened `FND-024`: at 1440×900 the dynamic-form table initially hides `Ações`/`Editar` behind horizontal scrolling. Web correction and visual refresh are routed before the next reviewer re-audit. |
| `2026-09-14` | The same Implementation Reviewer re-audited the corrected canonical candidate, consumed PATH-01 164/164, confirmed the refreshed 1440×900 catalog capture and returned `PASS` with no findings. Evaluation is ready for `conclude-spec`. |
| `2026-09-14` | The same Implementation Reviewer re-audited Web head `a3c79802` after the mobile-card correction and returned PASS with no findings. Core and Server CI plus Web architecture/code/types/unit stages passed; the final Web route gate reproduced the unrelated Formalization baseline failure (`FND-028`), so conclusion remains blocked without changing the canonical branch or the unrelated test. |
