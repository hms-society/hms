---
title: Advogado remarcar compromissos da própria agenda — implementation plan
status: in_progress
spec: ./spec.md
spec_revision: 1
evaluation: ./evaluation.md
jira_tickets:
  - SCRUM-146
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2686977/PRD+M+dulo+de+Agendamento
updated_at: 2026-09-29
---

# 1. Execution status

- **Spec:** [`./spec.md`](./spec.md), revision 1, `in_progress`.
- **Strategy:** Plan-backed because authorization is enforced in Core and surfaced in Web, with an integrated security review.
- **Current phase:** F3 source review completed; integrated validation remains in progress.
- **Next action:** Publish the candidate and record current PR CI; authenticated runtime and visual evidence remain pending.
- **Active blockers:** Local tests were not added or run under the task instruction. Use permitted type/lint checks and record PR CI; real manual/visual evidence remains pending.
- **Builders:** `builder_core` (`/root/builder_core`) and `builder_web` (`/root/builder_web`) completed; `reviewer` (`/root/reviewer`) completed the read-only integrated source review with no source blocker.
- **Coordination:** Core and Web change disjoint paths. No REST, Validation, Database, migration, generated-file, package or lockfile work is in scope.

# 2. Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `builder_core` | F1 | Enforce own-schedule rescheduling in Core | — | F2 | `completed` | Core typecheck passes; no tests added or run; authorization and locked schedule ownership reviewed. |
| 1 | `builder_web` | F2 | Expose role-specific rescheduling UI | — | F1 | `completed` | Web typecheck/lint pass; lawyer stays fixed for Lawyer; Admin/Attendant selector remains; no tests added or run. |
| 2 | `reviewer` | F3 | Integrated read-only security and UI source review | F1, F2 | — | `completed` | Current diff conforms to all CA at source level; findings and evidence gaps are recorded; no source blocker. Runtime/visual evidence remains open in validation. |

### F1 — Core authorization

#### F1-T1 — Authorize lawyer rescheduling only on their current agenda

- **Status/owner:** `completed` — `builder_core` (`/root/builder_core`)
- **Depends/parallel:** No dependency; parallel with F2-T1 on Web paths.
- **Paths:** Two Core use cases from the Spec; existing tests only if an expectation is contradicted.
- **Contract:** `RF-01`–`RF-02`; `CA-01`–`CA-02`.
- **Outcome:** Active lawyer can only query/reschedule eligible appointment in current owned schedule; cannot reassign. Admin/Attendant behavior is preserved.
- **Rules:** `documentation/rules/core-package-rules.md`, `documentation/rules/use-case-testing-rules.md`, `documentation/rules/code-conventions-rules.md`.
- **Exit:** `pnpm --filter @hms/core check-types` passed. No tests were added or run.

### F2 — Web capabilities and dialog

#### F2-T1 — Show only permitted actions and lock the lawyer field

- **Status/owner:** `completed` — `builder_web` (`/root/builder_web`)
- **Depends/parallel:** No dependency; parallel with F1-T1 on Core paths.
- **Paths:** Four appointment-details/reschedule UI source files named in the Spec.
- **Contract:** `RF-03`; `CA-03`–`CA-04`.
- **Outcome:** Responsible lawyer can reschedule without cancellation or reassignment; Admin/Attendant UI remains unchanged.
- **Rules:** `documentation/rules/ui-layer-rules.md`, `documentation/rules/code-conventions-rules.md`, `documentation/design.md`, `appointments-page/design/manifest.md`, `yVAoI.png`.
- **Exit:** `pnpm --filter web check:types` and `pnpm --filter web check:lint` passed; source tree and dialog were inspected. No tests were added or run; browser evidence remains pending.

### F3 — Integrated review

#### F3-T1 — Review integrated role boundary and dialog

- **Status/owner:** `completed` — `reviewer` (`/root/reviewer`)
- **Depends/parallel:** F1-T1 and F2-T1 integrated.
- **Paths:** Complete candidate diff under the Spec Core/Web paths; no edits.
- **Contract:** `RF-01`–`RF-03`; `CA-01`–`CA-04`.
- **Outcome:** Independent source review verifies ownership against the locked schedule and distinct UI capabilities.
- **Rules:** Full Spec Rule Pack, SDD, Architecture, Modules, Design and root agent guidance.
- **Exit:** Completed read-only conformance review; no source blocker. Review identified stale Plan/Evaluation wording, now reconciled. No tests/browser flow/screenshots were run; those evidence gaps remain explicit.

# 3. Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Core typecheck and current Core CI checks | `CA-01`–`CA-02` | Spec commands | `./evaluation.md` | `pending` |
| Automated | Web typecheck/lint and current Web CI checks | `CA-03`–`CA-04` | Spec commands | `./evaluation.md` | `pending` |
| Manual/runtime | `MV-01` own appointment, other appointment, wrong lawyer, persistence and cancel boundary | `CA-01`–`CA-02` | Spec `MV-01` | `./evaluation.md` | `pending` |
| Manual/UI | `MV-02` action visibility and dialog by role | `CA-03`–`CA-04` | `yVAoI.png`, 600 × 834; 390 × 844 | `./evaluation.md` | `pending` |
| Visual | Lawyer fixed-responsible state in reschedule dialog | `CA-04` | `yVAoI.png` | Fresh screenshot and comparison | `pending` |
| Review | Integrated read-only candidate review | `CA-01`–`CA-04` | Current Spec/Plan/diff | `./evaluation.md` | `pending` |

**Handoff condition:** Current type/lint checks and PR CI are recorded; old evidence affected by permission is marked stale; `MV-01`, `MV-02`, and visual capture are executed only under authorization or retained as pending; reviewer findings resolved; Spec tree and role restrictions match the candidate.
