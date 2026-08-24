---
name: resolve-pr-pendencies
description: Resolve reviewer comments on an open HMS pull request, reopening and rerouting its Spec delivery when feedback requires implementation or contract changes.
---

# Resolve Pull Request Feedback

Process reviewer conversations that arrive after a delivery PR is open. This workflow owns
feedback classification, replies and SDD reopening. It does not own the final CI gate, close
the Spec, implement changes or run implementation validation.

## Inspect the current review state

Read the open PR, current head SHA, unresolved conversations, reviews, Spec, Plan when
present, `evaluation.md`, actual diff and Jira ticket traceability. Ignore stale comments
that target superseded code only after verifying they are no longer applicable.

Read the complete applicable Confluence PRD and the delivery's Jira/RF/CA traceability. Preserve
external state; this workflow does not change Jira or Confluence without explicit authorization.

Preserve only actual Jira ticket or direct-request traceability. Do not resolve a
conversation before its requested action exists on the branch or an evidence-backed response
has been accepted.

## Classify every actionable comment

Classify feedback against the current Spec, saved design bundle, Rules, authoritative
documentation and implementation:

### Explanation only

Use when no repository change is required. Reply with concise evidence and resolve the
conversation only when appropriate. Do not reopen the Spec.

### PR metadata correction

Use for title, body, labels or traceability changes that do not alter repository artifacts.
Update the PR and reply. Do not reopen the Spec.

### Implementation correction

Use when the delivered implementation, tests or evidence does not satisfy the existing
Spec or Rules while the PR remains open:

1. change the same Spec from `completed` to `open` without incrementing its revision;
2. set the Plan and affected tasks/phases to `in_progress` when a Plan exists;
3. set `evaluation.md` to `status: in_progress`, append a review-cycle entry and record the
   comment URL as a mapped finding;
4. verify the finding against the delivered product and its Confluence PRD/Jira/RF/CA mapping;
5. invoke `implement-spec`; it automatically resumes the current Plan when one exists;
6. let that implementation workflow own fixes, invalidated evidence and manual validation;
7. after it returns evaluation to `ready`, invoke `conclude-spec` to commit, update the
   existing PR, run the final PR CI gate and close the Spec again.

Never apply the correction directly from this workflow, even when the comment appears small.
The resumed `implement-spec` run must repeat Builder activation/scope verification, Spec tree
conformance, affected Playwright behavior and fresh screenshot comparison where applicable.

### Contract change

Use when the reviewer requests different product behavior, design intent or technical
boundaries while the delivery PR remains open:

1. set the same Spec from `completed` to `draft`;
2. append the review comment and reason to its revision history;
3. route through `create-spec` for product/technical clarification and required authority;
4. once the amendment is approved, update the canonical Confluence PRD first when applicable
   and explicitly authorized, then reread it before the revised Spec is authored;
5. update Rules, Architecture, Modules, Design or Tooling first when required;
6. increment the Spec revision, reconcile the design bundle and validation, set
   `evaluation.md` to `status: in_progress`, set a
   reused Plan to `pending` or a replaced Plan to `superseded`, and return the Spec to `open`
   without a separate Spec review stage;
7. invoke `implement-spec` using the newly selected direct or Plan-backed strategy;
8. invoke `conclude-spec` again to update the existing PR,
   run CI and close the delivery.

If classification or expected behavior is ambiguous, ask the user before changing the Spec
or implementation.

When the requested action is clearly within the existing Contract, do not ask for permission to
fix it. Record the reviewer comment as a finding, route it through `implement-spec`, and let the
workflow continue until the affected evidence is current or an actual authority blocker exists.

For every accepted review finding, preserve the distinction between the concrete `Findings`
record and any reusable `Lessons learned` entry in `evaluation.md`. If the lesson reveals a
repeatable gap, update the applicable PRD, Architecture, Design, Tooling or Rule document before
conclusion; otherwise record an explicit no-change disposition. Do not close a review cycle
with only a resolved finding when the lesson requires authority updates.

## Post-merge boundary

Do not reopen a completed Spec after its PR has merged:

- use the bug-fix workflow for a defect against the delivered contract;
- create a change Spec under `changes/<change-name>/spec.md` for new or changed behavior.

## Completion report

Return:

- PR and conversation links inspected;
- classification and evidence for every actionable comment;
- replies or PR metadata changes made;
- Spec/Plan/evaluation transition when reopened;
- affected Confluence PRD sections and Jira/RF/CA traceability;
- workflow invoked or required next;
- unresolved comments and blockers.

Do not claim the PR is finally validated or close the Spec. `conclude-spec` owns the final PR
CI gate and closure after any implementation cycle.
