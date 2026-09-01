---
name: create-plan
description: Create a concise SDD execution Plan for an open feature Spec that needs dependent phases, parallel Builder ownership, risk control or a durable implementation ledger.
---

# Create a Plan

Create `plan.md` only when an `open` Spec recommends Plan-backed execution because it has
dependent phases, multiple applications or ownership boundaries, migration/integration
risk, meaningful parallelism, complex manual validation or a real need for recovery state.
After planning, `implement-spec` automatically selects this Plan. Use its direct strategy for
a small cohesive Spec.

The Orchestrator creates and owns the Plan in the current task. Builders never edit it.

The Plan is an execution ledger, not a second implementation contract. It must preserve the
Spec's exact revision and route every implementation change through `implement-spec`; never
create or reference a parallel implementation workflow.

## Preconditions and authority

Read `AGENTS.md`, `AGENTS.local.md`, `documentation/rules/sdd-rules.md`, the
current Spec, its Rule Pack, Architecture, Modules, and Tooling. Confirm:

- the Spec is `open` and its revision is current;
- the Technical and Validation Contracts contain enough detail to schedule work;
- every required design manifest/reference exists;
- every supplied design screenshot has a completed visual inventory, and all required
  supplemental-screenshot suggestions are captured or explicitly accepted as documented
  assumptions;
- Plan-backed execution remains appropriate;
- no material product or technical ambiguity remains.

Planning must not redefine product behavior or technical contracts. If planning exposes a
material ambiguity or requires a different contract, stop, return the Spec to the
`create-spec` amendment workflow and resume only after the revised Spec is `open`.

Use the Spec's real source and Jira ticket traceability. Do not invent or migrate external
records.

## Grilling gate

Before writing `plan.md`, apply the `grilling` protocol from
[`grilling-prompt.md`](./grilling-prompt.md). Build the execution design tree from the open
Spec's technical contracts, then ask the whole current frontier in one numbered round using the
required `❓`/`➡️` format with a recommendation for each question. Recompute the frontier after
every answer and defer questions whose technical or ownership prerequisites are not settled.

Facts about repository paths, ownership patterns, tooling, dependencies, and existing artifacts
must be researched or delegated to bounded read-only search; do not ask the user for facts that
can be verified. Grill unresolved execution decisions about phase boundaries, dependency order,
Builder ownership, parallelism, migration/generated-file coordination, recovery state, validation
handoff, and any PR decomposition required by repository limits. Do not use Plan questions to
silently redefine the Spec; route a product or technical Contract change back through
`create-spec`.

Do not create or modify `plan.md` while a material decision remains open. When the frontier is
empty, obtain explicit confirmation that shared understanding is complete, then record the
decisions in the Plan's execution status or ledger rather than preserving an interview transcript.

## Location and metadata

Create `plan.md` beside the governing `spec.md`, including inside a concluded feature's
`changes/<change-name>/` directory.

```yaml
---
title: <feature> — implementation plan
status: pending
spec: ./spec.md
spec_revision: 1
evaluation: ./evaluation.md
jira_tickets:
  - <PROJ-123> # omit when none
prd: <actual-confluence-url, optional>
updated_at: YYYY-MM-DD
---
```

`evaluation.md` is an expected colocated path. It is created by `implement-spec` at
implementation kickoff, not by `create-plan`.

## Required Plan structure

Write three required sections and one conditional section:

1. **Execution status**
2. **Execution ledger**
3. **Validation and handoff**
4. **Execution log** — add only after a risk, finding, failed attempt or material execution
   event exists.

Do not repeat the Spec's objective, scope, requirements, algorithms, declarations, schemas,
technical decisions or full Rule Pack. Reference the authoritative Contract instead.

### 1. Execution status

Keep one compact operational snapshot:

- Spec path, revision and `open` status;
- one-sentence rationale for Plan-backed execution;
- current phase;
- next action;
- active blockers;
- active Builders and the next dependency-ready Builder;
- only shared/generated-file, package/lockfile or other ownership coordination that cannot
  be represented by a single task.

Update this snapshot throughout implementation. If the Spec revision changes, record the
revision mismatch as a blocker, stop dependent execution and reconcile every affected phase,
task, path, criterion, design reference and validation target before resuming.

### 2. Execution ledger

Use one phase/parallelism table with exactly these columns:

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `builder_<boundary>` | F1 | `<outcome>` | — | — | `pending` | `<sensor-backed exit>` |

Derive the dependency graph and Builder ownership from the Spec's Technical Contract and affected
ownership boundaries. Use the exact subagent names `builder_core`, `builder_validation`,
`builder_server`, and `builder_web` for their corresponding affected boundaries; reserve
`reviewer` for the single integrated read-only review and `builder_fix_<boundary>` for an
independent correction when the owning Builder cannot be resumed. Do not create a Builder merely
because a package exists. Group small or tightly
coupled packages into one cohesive ownership assignment, and give a package its own Builder only
when its work is substantial and independently executable. Future applications and packages
follow the same evidence-based grouping instead of increasing the Builder count linearly.

Do not translate product-document ordering into phases or waves. Plan sequencing comes only
from the Spec's technical contracts, path ownership, and executable dependencies.

A Builder may own multiple sequential phases inside its ownership boundary. Phases control
sequencing and exits; they do not trigger fresh agents. Reuse the same Builder across related
phases and corrections to preserve context. Default to at most three concurrent implementation
Builders. Exceed that only when the Plan records a concrete parallelism benefit, stable contracts
and non-overlapping paths that justify the additional context and integration cost. The
Orchestrator owns root configuration, package installation, lockfiles, shared/generated-file
coordination and final integration.

Below the table, group concise task cards by phase:

```md
### F1 — <phase name>

#### F1-T1 — <task outcome>

- **Status/owner:** `pending` — `builder_<boundary>`
- **Depends/parallel:** <dependencies and safe parallel work>
- **Paths:** <exact owned paths or coherent path groups>
- **Contract:** <RF-* and CA-*>
- **Outcome:** <observable result>
- **Rules:** <exact applicable Rule paths and relevant `Antipatterns to Avoid` subsections, when present>
- **Exit:** <focused commands/sensors and required evidence>
```

Every task has exactly these seven concerns: status/owner, dependency/parallelism, owned
paths, RF/CA coverage, observable outcome, applicable Rules (including relevant
`Antipatterns to Avoid` subsections) and validation/exit. Reference the Spec for technical
detail. Assign every task to its stable ownership Builder; do not create one Builder per task.
Paths may not overlap between active Builders.

For every task that changes UI or browser behavior, its exit must also require: the exact Spec
widget tree comparison, applicable keyboard/narrow-viewport states, console and failed-request
inspection, and a fresh Playwright MCP screenshot for each affected design state. For every task
that changes server-backed behavior, its exit must require the real request/response and
persistence or authorization result; mocked transport is not sufficient evidence.

A Builder may not start until the Orchestrator records the exact Spec revision, assigned phases
and task paths, criteria, Rules, design references and exits. A task may not be marked complete
from a Builder report alone. On any error or discrepancy, keep it `in_progress`, record the
finding, invalidate affected evidence, resume the responsible Builder through `implement-spec`,
and rerun the exit without asking the user for permission to make an in-Contract correction.
Activate `builder_fix_<boundary>` only when the responsible Builder cannot be resumed or the
correction is genuinely independent.

Status vocabulary:

- **Plan:** `pending`, `in_progress`, `completed`, `superseded`;
- **Phase, task and coverage row:** `pending`, `in_progress`, `completed`.

Keep a failed or blocked item `in_progress` and record its finding/blocker and next action;
do not create failure statuses. Keep the final integrated phase `in_progress` while integrated
validation is active. Use `superseded` only when a revised Spec replaces
the Plan or switches to direct implementation.

### 3. Validation and handoff

Use one coverage table to schedule evidence without repeating the Spec's scenario steps:

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Manual | MV-01 | CA-01 | Spec MV-01 | `./evaluation.md` | `pending` |
| Visual (optional) | `<state>` | CA-02 | `./design/<reference>.png` | `Playwright screenshot path or CI artifact identifier` | `pending` |
| Runtime | `<integration>` | CA-03 | Integration Contract | `./evaluation.md` | `pending` |

Include only applicable rows. For design-backed UI, schedule every supplied screenshot and every
required supplemental state at its exact viewport and record an independent comparison row for
each. Do not create a dedicated visual-reference test or use one generic capture as evidence for
multiple states/viewports. Recommended supplemental screenshots may be deferred only when the
manifest records the decision and no acceptance gap remains. Builders use saved references;
the Orchestrator reopens Pencil through MCP when the Design Contract changes, a reference must
be refreshed, or the final comparison requires confirmation against the canonical node.

Schedule exactly one read-only subagent named `reviewer` using the
[`Integrated Reviewer`](../agents/reviewer-agent.md) contract after Builder
diffs are integrated and before readiness. Do not create Reviewers per Builder, phase, application
or package. The Reviewer checks
the complete candidate, cross-Builder contracts and all affected surfaces; when UI is affected,
it also inspects every required final visual comparison and independently replays high-risk
Playwright MCP interactions. Its report is not evidence: the Orchestrator verifies each finding,
records accepted findings in Evaluation and resumes the responsible Builder for correction. After
any correction, resume the same `reviewer` subagent to recheck the affected candidate; never
activate a replacement Reviewer merely because the implementation changed.

Define the final handoff condition: all tasks and phases completed, Spec validation
commands current on the integrated commit, generated artifacts/migrations reviewed,
services/accounts/fixtures ready, every `MV-*` executable, transient validation-artifact
identifiers recorded, the final Spec tree/conformance comparison passed, all additional-screenshot
decisions resolved, `reviewer` completed, every verified review finding resolved and
no blocking finding active. Then
route directly to `conclude-spec`.

### 4. Execution log — conditional

After implementation starts, record only material operational entries:

```md
- **YYYY-MM-DD — <phase/task event>**
  - **Finding/result:** <evaluation finding ID or concise result>
  - **Next action:** <action>
```

The Plan owns status, attempts and next action. Full command evidence, screenshots, finding
details and verdicts belong in `evaluation.md`.

## Plan integrity and author summary

Before saving, verify the Spec revision, acyclic dependencies, complete RF/CA scheduling,
non-overlapping active paths, valid Rule paths, executable exits, complete `MV-*`/design
coverage, stable Builder ownership, justified concurrency, final conformance checkpoints and
valid colocated links.

After creating or materially revising `plan.md`, return a concise summary with:

- clickable Plan path, status and Spec revision;
- reason for Plan-backed execution;
- number of waves, phases and tasks;
- active Builders, reused phase assignments, parallel waves, critical dependencies and
  shared ownership;
- the scheduled `reviewer` subagent and its affected surfaces;
- planned manual/runtime/visual coverage;
- active risks or blockers;
- initial phase and next action.

Do not claim unexecuted phases, sensors or validation passed. If the Spec is not `open`, the
revision is stale or a prerequisite is missing, report the blocker instead of presenting the
Plan as implementation-ready.
