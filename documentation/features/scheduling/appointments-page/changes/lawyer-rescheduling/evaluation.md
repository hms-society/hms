---
feature: "scheduling/appointments-page/changes/lawyer-rescheduling"
spec: ./spec.md
plan: ./plan.md
spec_revision: 1
status: in_progress
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2686977/PRD+M+dulo+de+Agendamento
jira_tickets:
  - SCRUM-146
updated_at: 2026-09-29
---

# Evaluation

Evaluation of Spec revision `1` against the current implementation.

Current result: Core and Web source changes implement the own-schedule Lawyer contract; Core typecheck and Web typecheck/lint pass. Independent source review and PR CI are pending. Local tests were not added or run; authenticated runtime/manual and role-specific screenshot evidence remain pending.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `CA-01` | `EV-01`; `MV-01` | `pending` |
| `CA-02` | `EV-01`; `MV-01` | `pending` |
| `CA-03` | `EV-01`, `EV-11`; `MV-02`; `VIS-01` | `pending` |
| `CA-04` | `EV-01`, `EV-11`; `MV-02`; `VIS-01`–`VIS-02` | `pending` |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-01` | Cross-layer | Baseline source conformance inspection of Core slot/reschedule use cases, actor mapping, appointment detail permission hook and reschedule dialog | Core rejected every Lawyer before appointment lookup; UI shared an Admin/Attendant manage flag and hid both actions for Lawyer. Core request already carried actor, optional target lawyer and locks. No source edits at baseline. | `passed` |
| `EV-02` | Cross-layer | Confluence HMS search and full canonical PRD readback, page `2686977` | PRD v14 REQ-018/JN-010 permits active Lawyer rescheduling only in own schedule, without reassignment; Admin/Attendant retain selection. Readback confirmed clauses and unique JN-001–JN-012 headings. | `passed` |
| `EV-03` | Cross-layer | `git status --short --branch`; `git diff --stat`; staged diff inspection | PR worktree `codex/agenda-web` began clean at published PR #183 head. | `passed` |
| `EV-04` | Core | `pnpm --filter @hms/core check-types` after F1 integration | Passed (exit 0) after frozen-lockfile dependency installation. No tests were added or run locally. | `passed` |
| `EV-05` | UI | `pnpm --filter web check:types` and `pnpm --filter web check:lint` after F2 integration | Both passed (exit 0); Biome checked 620 files. No tests were edited or run. | `passed` |
| `EV-06` | Cross-layer | Current follow-up PR CI after candidate push | Pending; this correction is split as a dependent PR based on the Agenda delivery to meet the repository size limit. Record current head and check/run URLs after GitHub completes. | `pending` |
| `EV-07` | Cross-layer | Plan-backed Builder activation | `builder_core` owns F1-T1 and two Core use cases; `builder_web` owns F2-T1 and four appointment-details/reschedule UI files. Spec revision, criteria, paths, Rule Pack, design reference and non-test checks were recorded before code edits. | `passed` |
| `EV-08` | Tooling | `pnpm install --frozen-lockfile` in `/tmp/hms-agenda-web-final` | Lockfile current; all 5 workspace projects installed 1477 packages; no manifest/lockfile change. | `passed` |
| `EV-09` | Core | Initial Core typecheck before dependency installation | Failed before useful project diagnostics because worktree lacked `node_modules`; superseded by EV-04. | `stale` |
| `EV-10` | UI | First F2 typecheck/lint attempt | Typecheck found new capability props missing from typed component mocks; lint reported generic role and formatting. Builder corrected source contract/markup before rerunning. | `stale` |
| `EV-11` | UI | Final Web typecheck/lint after correction | Both passed (exit 0); Biome checked 620 files. Lawyer action/selector are role-specific. | `passed` |
| `EV-12` | Cross-layer | Read-only integrated source review of current F1/F2 candidate | No source blocker found. Core enforces active Lawyer ownership against the appointment’s current and locked schedule and rejects reassignment; authenticated actor identity comes from server guards. Web separates cancellation/rescheduling, fixes the Lawyer field for Lawyers, and preserves the Admin/Attendant selector. Reviewer confirmed exact rendering and runtime behavior remain unverified. | `passed` |
| `EV-13` | Cross-layer | `git diff --check` after integration | Passed with no whitespace errors. | `passed` |
| `EV-14` | Tooling | `pnpm install --frozen-lockfile` after recreating the PR worktree | Passed; all workspace dependencies installed and no tracked manifest/lockfile changes. | `passed` |
| `EV-15` | Core | `pnpm --filter @hms/core check-types` on the recovered candidate | Passed (exit 0). No tests added or run. | `passed` |
| `EV-16` | UI | `pnpm --filter web check:types` and `pnpm --filter web check:lint` on the recovered candidate | Both passed (exit 0); Biome checked 620 files. No tests added or run. | `passed` |
| `EV-17` | Cross-layer | `git diff --check` on the recovered candidate | Passed with no whitespace errors. | `passed` |
| `EV-18` | Cross-layer | Read-only integrated review of the current Core/Web candidate | Completed: no source blocker. The reviewer found and this ledger corrected stale status wording in `EV-07`/Plan. Does not establish runtime or visual behavior. | `passed` |
| `EV-19` | Publication | PR #183 size check on the unsplit candidate `0464d946` | Failed: 5,069 added TypeScript lines exceeded the 5,000-line limit. This candidate was removed from PR #183 and the change is now a dependent delivery based on `codex/agenda-web`; the new PR diff is 221 added TypeScript lines. | `stale` |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | Lawyer own schedule vs another lawyer, slot lookup, remarcação/persistence and cancellation boundary | `CA-01`, `CA-02` | Own eligible appointment moves in same schedule; another appointment or different `lawyerId` is denied; appointment, Consultation and history remain consistent; lawyer cannot cancel. | Not executed. No authenticated session started for this task. | `pending` |
| `MV-02` | Role-specific actions and reschedule dialog | `CA-03`, `CA-04` | Responsible Lawyer sees Remarcar only and a fixed lawyer; another Lawyer sees no write actions; Admin/Attendant retain Cancelar/Remarcar and selector. Keyboard and 390 × 844 remain usable. | Not executed. No browser assertions/screenshots run. | `pending` |

## Visual evidence

| ID | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `VIS-01` | Reschedule dialog for responsible Lawyer with fixed lawyer | 600 × 834 | `../../design/yVAoI.png` | — | New Lawyer state hides editable lawyer selector while retaining date, slots and confirmation; capture/inspect exact viewport. | `pending` |
| `VIS-02` | Reschedule dialog for responsible Lawyer, narrow | 390 × 844 | `../../design/yVAoI.png` | — | Responsive fixed-lawyer state, focus, keyboard and scroll need current capture/inspection. | `pending` |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| Rule Pack | `documentation/rules/core-package-rules.md`; `use-case-testing-rules.md`; `ui-layer-rules.md`; `code-conventions-rules.md` | `passed` | Read before implementation. No Rule or architecture change requested. |
| Design | `documentation/design.md`; `appointments-page/design/manifest.md`; `yVAoI.png` | `pending` | Read/inventoried; role-specific visual state lacks fresh evidence. |
| PRD | Confluence `2686977`, v14 REQ-018/JN-010 | `passed` | Canonical authority updated and reread before the change Spec. |
| SDD | `documentation/rules/sdd-rules.md`; tooling, modules and architecture docs | `passed` | Read for change workflow, ownership and validation. |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-01` | Contract/authorization/UI | PRD v14 REQ-018/JN-010 versus Spec 13 baseline and current source | `EV-01`, `CA-01`–`CA-04`, `MV-01`–`MV-02`, `VIS-01`–`VIS-02` | `resolved` | Implemented and confirmed by read-only source review; CI and runtime evidence remain tracked independently. |
| `FND-02` | Validation/environment | Task instruction disallows adding/running tests locally; authenticated-browser/manual flow not executed | `EV-06`, `MV-01`–`MV-02`, `VIS-01`–`VIS-02` | `active` | Keep runtime/manual/visual evidence explicitly pending; PR CI can supply automated checks. |
| `FND-03` | Environment | Initial Core typecheck used fallback TypeScript because isolated worktree lacked dependencies | `EV-09` | `resolved` | `pnpm install --frozen-lockfile`; documented Core typecheck passed as EV-04. |
| `FND-04` | Implementation/lint | Initial Web wiring left typed mocks incomplete and added generic role/formatting issue | `EV-10`–`EV-11`, `CA-03`–`CA-04` | `resolved` | Dialog permission props default to deny, generic role removed, formatting corrected; Web typecheck/lint pass. |
| `FND-05` | SDD process | Implementation edits began while change Spec was still `open` | `EV-07`, `EV-12` | `resolved` | Spec set to `in_progress` at integrated checkpoint and Plan/Evaluation reconciled; no Contract change after activation. |
| `FND-06` | Environment/recovery | Temporary PR worktree disappeared after Builder completion | `EV-14`–`EV-18` | `resolved` | Recreated `/tmp/hms-agenda-web-final` from `codex/agenda-web`, reconstructed the recorded candidate diff, reinstalled frozen dependencies and reran Core/Web type/lint and diff checks. Branch and PR remained unchanged during recovery. |
| `FND-07` | SDD status consistency | Review identified stale Plan Spec status and contradictory wording in the Builder activation evidence | `EV-07`, `EV-18` | `resolved` | Reconciled Plan’s Spec status to `in_progress` and corrected the Evaluation wording; source review completed with no blocker. |
| `FND-08` | Publication size | PR #183 size gate counted 5,069 added TypeScript lines against the 5,000-line maximum | `EV-19` | `resolved` | Kept the original Agenda delivery within its size limit and separated the coherent Lawyer rescheduling authorization/UI correction into a dependent PR based on `codex/agenda-web`. |

## Lessons learned

| Lesson | Source finding | Authority disposition |
| --- | --- | --- |
| Core must authorize against the current schedule owner, while UI separates cancellation and rescheduling capabilities. | `FND-01` | Feature-local decision in PRD v14 REQ-018/JN-010 and this Spec; no reusable Rule change. |
| CI does not substitute for authenticated browser evidence or exact visual comparison. | `FND-02` | Existing SDD/root guidance covers this; local manual/visual evidence stays pending. |

## PR CI quality gate

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |
| `CI-01` | Lawyer rescheduling follow-up Core package checks | `<pending>` | `pending` | `<pending>` |
| `CI-02` | Lawyer rescheduling follow-up Web app checks | `<pending>` | `pending` | `<pending>` |
| `CI-03` | Lawyer rescheduling follow-up Check PR Size and Review | `<pending>` | `pending` | `<pending>` |

## History

| Date/Time | Event |
| --- | --- |
| `2026-09-29 16:45` | Change Spec revision 1 created from the user-confirmed own-agenda decision; PRD v14 read back; baseline/findings/validation gaps recorded. |
| `2026-09-29 16:47` | Activated `builder_core` and `builder_web` for F1/F2 with disjoint scopes. |
| `2026-09-29 16:52` | Core implementation integrated; initial typecheck invalidated by absent worktree dependencies; frozen-lockfile install completed. |
| `2026-09-29 16:54` | Core typecheck passed; no tests run. |
| `2026-09-29 16:56` | Web typecheck/lint passed after correcting initial source interface/markup findings; no tests run; browser/manual/visual evidence pending. |
| `2026-09-29 17:02` | Recovered the removed PR worktree from `codex/agenda-web`, reconstructed the recorded source and SDD diff, reinstalled dependencies and reran Core typecheck, Web typecheck/lint and `git diff --check`; all passed. No tests added or run. |
| `2026-09-29 17:03` | Read-only integrated source review completed with no source blocker; corrected stale SDD status wording. PR CI and manual/visual evidence remain pending. |
| `2026-09-29 17:45` | PR #183 check-size rejected the combined candidate at 5,069 added TypeScript lines. Reverted that candidate from PR #183 and split the authorization/UI correction into a dependent branch/PR; original implementation commit remains available in the follow-up history. |
