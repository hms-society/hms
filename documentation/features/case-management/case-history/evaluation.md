---
spec: documentation/features/case-management/case-history/spec.md
status: in_progress
updated_at: 2026-10-16
---

# Case history evaluation

## Current State

| Field | State |
| --- | --- |
| Implementation | Complete CA-01–05 within selected scope; CA-06 implementation complete |
| Automated checks | Focused Core/Validation/Web and native behavior passed; new AUTO-05 unit/route checks passed. Changed-code coverage rerun failed on the aggregate dirty Web candidate. AUTO-03 Blocked because mutation runner absent. Aggregate inherited gates remain failed/partial. |
| Manual checks | Previous checks passed against isolated real services and the running local application; new exclusion check could not reach the protected route because the saved session was expired. |
| Visual checks | Previous independent rendered assessment passed; new exclusion was exercised in mocked route tests, with no fresh authenticated screenshot. |
| Independent review | Prior integrated code and rendered assessment passed with two findings resolved; the new CA-06 exclusion has not received an independent review. |
| Blockers | Required mutation runner absent; unrelated dirty candidate gates may fail and need separate attribution; authenticated rerun for CA-06 is unavailable with the expired saved state |
| Candidate | Isolated delivery slice `feat/case-history-core`, Core/Validation implementation based on `9fddbae06`; remaining Server/Web slices are not part of this candidate. The original aggregate candidate in `feat/checklist-enhancement` remains preserved in the root workspace. |

## Current delivery slice — Core and Validation (2026-10-16)

This PR isolates the Case History Core/Validation boundary after the client-document-source predecessor merged as PR #238. It adds the persisted history model and use cases, actor/source authorization contracts, immutable task-history capture, and request validation. It does not include the REST adapters, Web interface, or the full-feature readiness claim. Those remain follow-on delivery slices.

| Check | Type | Status | Observed result | Artifacts / limits |
| --- | --- | --- | --- | --- |
| SLICE-02 | Automated | Passed | On the synchronized `feat/case-history-core` candidate, seven owning Core test files passed 74/74; the owning Validation schema test passed 29/29. Core and Validation typechecks and architecture checks passed; both package lint commands exited 0. `git diff --check` passed. | Candidate `9fddbae06` plus this Evaluation update; focused test output from the isolated worktree. Core lint reported 25 existing warnings outside this slice. |
| SLICE-02-SIZE | Automated | Passed | The corrected candidate adds 2,051 TypeScript lines versus current `origin/develop`, below the repository 5,000-line cap. | `git diff --numstat origin/develop...HEAD`, filtered to `.ts`, `.tsx`, `.mts`, `.cts`, matching `.github/workflows/check-pr-size.yml`. |
| PR-240-CI-01 | Automated | Corrected locally; new PR-head CI pending | Initial PR CI found that three existing Server controllers still instantiate task use cases with three arguments. The Core history ports are now optional during this staged Core-only delivery; legacy invocations preserve existing task behavior without claiming a history write. Supplying both ports continues to wrap task mutation and history append in the same transaction. Added compatibility coverage: four focused Core test files passed 40/40; Core and Server typechecks passed; focused Biome check passed. | The failing PR run is retained on PR #240. The corrected commit must pass all current-head workflows before this check is complete. |

The earlier `SLICE-01` failure remains historical and records that this branch could not pass before PR #238 supplied its client-document dependency. After PR #238 merged, the history candidate was synchronized and the focused suite passed. The existing Server task endpoints do not emit task-history records until the follow-on Server wiring supplies both history ports; this candidate preserves their previous behavior while keeping the Core API compatible. This slice still does not resolve the feature-wide mutation evidence blocker (`AUTO-03`) or inherited aggregate baseline failures; the feature Evaluation therefore remains `in_progress` and is not a completion verdict.

## Progress

| Criterion | Implementation | Verification | Checks | Remaining work |
| --- | --- | --- | --- | --- |
| CA-01 | Complete | Passed | AUTO-01,02,04; MAN-01 | None |
| CA-02 | Complete | Blocked | AUTO-01,02,03; MAN-01 | Required mutation evidence unavailable; behavioral permission checks passed |
| CA-03 | Complete | Blocked | AUTO-01,02,03,04; MAN-02 | Required mutation evidence unavailable; behavioral checks passed |
| CA-04 | Complete | Blocked | AUTO-01,02,03 | Required mutation evidence unavailable; behavioral checks passed |
| CA-05 | Complete | Passed | AUTO-04; MAN-01,02; VIS-01 | None |
| CA-06 | Complete | Partial | AUTO-05 | MAN-01 authenticated rerun unavailable; Web changed-code coverage is masked by unrelated dirty source files |

## Check Results

| Check | Type | Status | Observed result | Artifacts |
| --- | --- | --- | --- | --- |
| AUTO-01 | Automated | Passed | Initial58 Core and29 schema tests passed; final74 Core tests passed with per-file85/80 floors; totals95.77% statements,92.91% branches,96.82% functions,96.66% lines. Types and focusedlint pass. Follow-up creation-label assertion passed. Initial UpdateTask coverage failure corrected with meaningful authorization/validation/snapshot tests, not weaker floors. | .playwright-cli/logs/case-history-core-coverage-final-all/; case-history-core-types-final.log; create-label-tests.log |
| AUTO-02 | Automated | Passed | Current 56 distinct native HTTP scenarios passed using real Auth/PG/Storage/Inngest fixtures, including concurrency, late inserts, rollback and source union. Initial current coverage run: 54 passed/1 timeout; combined Admin/foreign test split without increasing timeout, corrected list suite11/11 passed, unaffected45 reused. All10 executable measured production files100%;4 DTO files have no executable code. Isolated migration0068 passed. Earlier failed commands/DI/report-collision runs retained. | apps/server/tmp/coverage-case-history-current/; /tmp/hms-history-native-coverage-current.log; /tmp/hms-history-list-timeout-correction.log |
| AUTO-03 | Automated | Blocked | HMS has no configured mutation runner; tests/coverage do not replace mutation evidence | Spec |
| AUTO-04 | Automated | Passed | Final73 tests passed, per-file85/80 floors;97.96% statements,92.09% branches,96.32% functions,98.38% lines. Mocked browser5/5 + postRHFmanual1/1 passed; Webtypes/build/lintpass. Initial broader82tests emitted intermittent unchangedpage-hook schedulerteardown; isolatedunchanged6/6 passed; originalfailure retained separately. | .playwright-cli/logs/case-history-web-coverage-final/; case-history-web-coverage-final-output.log; /tmp/hms-history-web-build-final.log |
| AUTO-05 | Automated | Passed | 56 Web tests across14 files passed; focused mocked case-history route4/4 passed, including mixed manual/automatic rows, no manual filter/action, and automatic pagination. Web typecheck passed; Biome passed for11 touched Web files. An initial typecheck caught the removed fixture body property; the fixture type was corrected and the full Web typecheck rerun passed. | Current task command output; Playwright artifacts ignored under apps/web/.playwright-cli/auto06-* |
| SLICE-01 | Automated / isolated Core candidate | Failed — predecessor absent | The clean `feat/case-history-core` candidate (+1,932 TypeScript lines) ran7 focused Core test files:61 passed,6 failed because `ClientDocumentFaker` is introduced by the separate client-document-source Core slice and is not present on current `develop`. This establishes a real dependency; it is not a test pass or an implementation regression. Validation/type checks did not run after the Core test failure. Rebase and rerun after the source predecessor merges. | `.worktrees/pr-split-validation/case-history-core-standalone.log` |
| COVERAGE-06 | Automated | Failed | Focused selection ran26 tests across4 files successfully, but changed-code checker evaluated the existing aggregate dirty Web candidate and failed many unrelated untouched files. This run does not establish a regression in the history hook; retain the prior feature-owned coverage report as historical. | apps/web/.playwright-cli/auto06-* |
| MAN-01 | Manual | Passed | Real isolated member feed20→23, literal search1, Case category1; keyboard filter/load-more and390×844 no overflow. Active Admin without membership reads one opening row and cannot register. Running local app5000/API5555: real MAN-03 case history200,20→21 persisted rows including opening on page2, legal member registration visible; console0 errors/0 warnings. Initial wait for opening on first page timed out; corrected pagination assertion passed. No shared data writes. | .playwright-cli/screenshots/case-history-admin.png; case-history-running-local.png; .playwright-cli/logs/case-history-running-local-final-{requests,console}.log |
| MAN-02 | Manual | Passed | Actual isolated Auth/API/Storage fixture: blank confirmation disabled; cancel/Escape no records; selectedidentity.pdf; controlled transport abort then exact same operation/payload retry201; one stored copy with actor/document. Occurrence2026-10-12T09:30Brazil persisted12:30Z; recorded2026-10-13T14:21:58.677Z separate. Protected exact document200 loadedPDFiframe/download. PersistedGET200:24records,23manual,registeredcopy1,cancelrecords0. Stable Escape restored focus desktop/mobile; initial transient focusfalse during HMR repeatedsuccessafterstablecapture. | tmp/case-history-manual.test.ts ignoredharness; .playwright-cli/logs/case-history-member-final-{requests,console}.log; screenshots/dialog-mobile.png |
| VIS-01 | Visual | Passed | Parent and independent history_integrated_review inspected fresh actual desktop1200×1050/mobile390×844/dialog/reader againstT3XLf7. Initial cramped toolbar corrected; current six desktop tabs single row and coherent toolbar wrapping. Mobile modal358×700, viewport390×844, no horizontal overflow. Additional manual audit metadata intentionally adds row height. | design/T3XLf7.png; .playwright-cli/screenshots/case-history-{desktop-final,mobile-final,dialog-mobile,document-reader}.png |
| BASE-01 | Automated | Failed | Core/Validation/Server/Web types and Server/Web builds passed. Core/Validation/Server architecture passed; Web7 inherited cycles failed, none in history. Core14/Server34 inherited complexity errors; none introduced by this scope. Core/Validation/Web lint passed; Server aggregate formatting fails in unrelated checklist model/0067 snapshot, focused history/0068 files pass. Owned Core/Web changed-coverage floors passed; aggregate checker lacks unrelated dirty files in focused reports (Web74). Native measured Server scope100%. No baseline refresh. git diff --check passed. | .playwright-cli/logs/case-history-core-changed-final-audit.log; case-history-final-diff-check.log; focused coverage and builder gate logs |

## Source and draft review evidence

Read complete canonical Case PRDv8 (45613057, updated2026-10-12), selected user reply and PencilT3XLf7. Read-only history_backend_research/history_web_research established current root ports, records, task CAS and existing source reader. CodeGraph query for CaseManagementModuleFixture/manual harness returned frozen-index warning: auto-sync disabled by file lock and unrelated worktree sources. Targeted current root files supplied missing fixture/REST details; index unchanged.

Independent history_spec_review re-audit resolved saved reference, live cursor/context/millisecond precision, declaration completeness, exact reference-source comparison and replay ordering. It found two final bounded additions: executable selections and snapshot customType/reminders/completion fields. Both applied before opening; no architectural/authorization/product blocker remained. Initial opening transitioned directly into authorized implementation.

## Findings

| ID | Problem | Affected checks | Status | Resolution |
| --- | --- | --- | --- | --- |
| FND-001 | Missing mutation runner | AUTO-03 | Open | Executable tooling needed; no inferred waiver |
| FND-002 | Generic completion/cancellation titles obscured outcome | CA-04 | Resolved | Specific task/deadline titles, mandatory prior snapshots and owning tests; reviewer rechecked |
| FND-003 | Manual form duplicated syntax rather than canonical RHF/schema | CA-03,05 | Resolved | RHF+zodResolver(shared registerCaseUpdateSchema), retained timezone/replay recovery;55focused then69coverage tests passed; reviewer rechecked |
| FND-004 | Native document fixture DI missing concurrently introduced review usecase | AUTO-02 | Resolved | Other active stream registered existing provider; current startup/productiontypes verified. Failed run preserved; current native source tests passed |
| FND-005 | Concurrent coverage run removed nested history report temporary directory | AUTO-02 | Resolved | Preserved ENOENT failure; waited for unrelated native run, moved reports to task-owned apps/server/tmp outsidecoverageparent; current native rerun passed with100% measured production coverage |
| FND-006 | Unrelated Serverformat/complexity and Webarchitecture aggregate violations | BASE-01 | Open | Preserve existing changes; history-focused lint/types/coverage and no new complexity/architecture violations verified; no baseline refresh |
| FND-007 | Authenticated MAN-01 check could not verify the new exclusion | CA-06 | Open | Saved lawyer state redirected to login; source-verified seed password is supplied through private `HMS_USER_SEED_PASSWORD`, unavailable from the checked-in seeder. No unverified credential was used; route-level mocked Playwright coverage passed. |

## Lessons Learned

The consolidated feed uses existing Case-owned histories directly. Legacy records cannot truthfully distinguish upload from selection or reconstruct previous task edits; those labels/snapshots are only captured prospectively.

## Local preparation and runtime evidence

Spec revision2 corrected an invented blanket local-DDL approval restriction after bounded independent migration review. Applied only inspected additive0068 DDL transactionally to local PostgreSQL17.6 after verifying table absence and taking a private ignored schema backup. Existing10 cases/31 checklist items and relevant record fingerprints remained unchanged; migration journal remained unchanged. Readback verified columns, restrictive foreign key and indexes. No reset, shared seed, journal rewrite or other pending migration replay occurred. The preexisting local migration-journal divergence remains outside this delivery. Evidence: `.playwright-cli/logs/case-history-local-0068-application.log` and private ignored pre-migration backup.

The isolated fixture's unmounted unrelated communications/summary routes emitted404/500; history routes succeeded except the intentional transport abort. Running complete local application produced a clean console and successful real history pagination. All task browser sessions, temporary Vite3000 and disposable fixture processes are closed. Shared Web5000/Auth8000/Docker remain untouched.

## Handoff

| Field | Detail |
| --- | --- |
| Candidate | Root feat/checklist-enhancement, existing dirty changes preserved |
| Completed | Selected implementation,232 focused tests (Core74,Validation29,Web73,native56),5 mocked browser scenarios, real-service Manual and Visual checks, independent integrated review, additive local schema preparation |
| Unfinished | AUTO-03 mutation tooling/evidence; inherited aggregate failures prevent official ready verdict |
| Uncommitted changes | History implementation and artifacts, including this Evaluation update, remain alongside preexisting aggregate changes; no broad staging/reset |
| Active processes | No task-owned server, test, browser or Vite process is active. Docker was started by the user and remains available. |
| Blockers | Required mutation runner absent; inherited aggregate gates failed |
| Next action | User can test Histórico in local Web5000; configure authorized mutation tooling and address separately attributed aggregate failures before readiness/conclusion |

## Delivery

| Field | Result |
| --- | --- |
| Disposition | The Core/Validation delivery slice is prepared for review; the full feature remains incomplete and not ready. Follow-on Server/Web slices, mutation evidence, and inherited aggregate baseline work remain outstanding. |
| Documentation Alignment | Canonical PRDv8 selected partial REQ-015 scope; no external writes authorized/needed. Saved T3XLf7 reference and Spec aligned. |
| Revision History | Revision1 selected contract; revision2 operational local-DDL guidance correction, behavior unchanged |
| Limitations | Deferred lifecycle/overdue/complete Production capture; required mutation runner unavailable; inherited aggregate gates failed; preexisting local migration journal divergence preserved |

## Local migration repair — 2026-10-13

User reported failed seed and migration application, then explicitly requested repair. Live database migration cutoff skipped0061 task creation; pending0062 expected absent case_tasks. Reproduced pending SQL transactionally with rollback. Backed up the database privately under ignored `apps/server/tmp/migration-repair/before.dump` (mode600). Verified on an isolated database copy before applying the same transaction locally. Applied missing audit/task migrations0059–0063, added missing intake state constraints from0066, verified existing later table/column/constraint/index outcomes, and appended exact current migration hashes/timestamps0059–0068 while preserving all73 historical journal rows. Journal now83 rows. All93 preexisting public table row counts/fingerprints remained unchanged; four new tables were created. `pnpm db:migration:apply` then exited0; API5555 health200. The isolated database was removed. Seed/reset was not run. Repair artifacts remain ignored. Older unrelated schema differences discovered during comparison (including legacy document specification content type) were not changed by this bounded repair. This supersedes the earlier note that current pending migration divergence was left unresolved.

## Checklist confirmado history projection — 2026-10-13

User requests successful checklist confirmation appear as history event. Added canonicalChecklistConfirmed kind and UNION source from Case storedapprovaldecision/time/actor, underdocumentscategory, stablechecklist-confirmation:CaseID. Existingapproval/exception recordsprojectautomatically; blocked/rejected excluded. Existingusecaseenrichesactorname, preservesfilter/search/pagination andnorepeatedIDs. UI approval/homologation successinvalidateactor-scopedhistoryprefix. No newstorage/DBmigration/messagebroker/eventbus orshareddata mutation.

NativehistoryHTTPoriginal15cases13Passed2newnegativefixtureFailures due missingrequiredrejectionremarks. Correctedfixtureusesstoredreason; affected4decisionmatrix casesPassed70.31s with11intentionalfilteredSkipped, verifyingapproval/exceptiontime/name/details/stableID/search/category/repeatedreadsingleentry andnoeventfornegative decisions. Originalremaining11greenretained; no fullgreenrerunclaim. Server/WebtypesPassed; scopedBiome4/diffPassed. Webowninghookoriginal43:42Passed1unrelatedconcurrentlymodifiedadd-item dialogtestFailure; currentaffected6gatechecksPassed7.03s with37filteredSkipped. No unrelatedsource/testrewrite.

RealauthenticatedLawyerCLI verifiesexistingCaseCASO-20261013-0001 nowshowsChecklistconfirmado at13:08 withAdvogadodedesenvolvimento, matchingstored16:08:10.421UTCdecision. Freshchecklist-confirmed-history.png visuallyinspected. Firstsaved-stateattempttimedoutbeforetab; freshvisibleloginusingseedcredentials recovered. Browserclosed; nouserCaseapproval/revoke performedbyagent (concurrentuserwaiverrevocation remains). Sharedservicesrunning. This narrowrequestcomplete; overallSpec/inheritedmutation/coverage limitations retained.

## Manual andamento exclusion from the Histórico screen — direct request 2026-10-13

Revision3 of the Spec narrows the Web presentation contract: the history hook filters the `manual` category before grouping, and the case-history screen no longer offers manual-category filtering or registration controls. Persisted manual records, Core use cases, REST endpoints and isolated manual-dialog/backend tests remain unchanged. The existing Case PRD still governs backend manual-record capability; no Confluence update was requested or made. CodeGraph was not re-queried because its index remains disabled by the previously recorded lock warning; current root source paths were already identified and are covered by focused tests.

Verification for CA-06: AUTO-05 unit and mocked route coverage passed, and full Web typechecking plus focused Biome checks passed. The authenticated local MAN-01 attempt restored the saved lawyer state but the protected case route redirected to login; the seed reads its password from private `HMS_USER_SEED_PASSWORD`, so no unverified credential was entered. The CLI session was closed and its generated login snapshot removed because it included credential fields. The changed-code coverage command ran26 selected tests successfully but its checker evaluated the aggregate dirty Web candidate and failed against many unrelated changed files. Previous AUTO-04/MAN-01 results remain historical and do not cover this decision; a fresh authenticated visual/manual check remains open.
