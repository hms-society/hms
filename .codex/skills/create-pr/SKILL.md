---
name: create-pr
description: >
  Publish or update coherent HMS delivery PRs with current Spec and Verification Contract traceability and current-head CI.
---

<!-- Auto-generated from documentation/prompts/create-pr-prompt.md -->


# Create or Update Pull Requests

Publish authorized HMS delivery through coherent, size-compliant GitHub PRs.
Follow [Git Workflow Rules](../../../documentation/rules/git-workflow-rules.md),
[Commit Rules](../../../documentation/rules/commit-rules.md), [SDD Workflow](../../../documentation/sdd.md),
[Tooling](../../../documentation/tooling.md) and the repository `gh-cli` skill. Use authenticated `gh`,
preserve user work and update existing delivery PRs instead of creating duplicates.

## Authority and readiness

Read the implemented Spec or Bug Report, Evaluation, current diff and applicable
Rules. Feature Evaluation uses the
[canonical template](../../../documentation/prompts/implement-spec-prompt.md#evaluation-template); **Progress** separates
implementation from verification and **Check Results** records actual required
Automated, Manual and Visual checks plus baseline project checks. Verify current
candidate/environment/selection/artifacts; preserve failed and historical proof.
The Spec owns revision history; Evaluation does not repeat revision metadata.

Require authorization to commit, push and create/update the PR; reuse authority
already provided. Standalone use invokes `commit-code` for pending scoped changes,
then resumes publication. Calls from `conclude-spec` reuse its prepared commits.
Do not mutate external Jira/Confluence state or merge/deploy as a side effect.

Every delivery PR is ready for review, unless the user requested a draft. Use
`gh pr ready <number>` for an existing draft under the normal readiness policy,
and verify `isDraft` before reporting publication.

## Inspect and preserve scope

Inspect complete staged/unstaged/untracked changes and delivery history:

```bash
git status --short
git diff --stat
git diff
git diff --cached --stat
git diff --cached
git log -10 --format='%h %s'
```

Identify affected workspaces, generated files, migrations, lockfiles, seeds and
configuration. Exclude secrets/local data and unrelated or inherited user changes;
leave them intact. Resolve ownership from the task and diff; if it remains
ambiguous, exclude the file and explain the uncertainty rather than ship it.

## Size, slicing and branches

`.github/workflows/check-pr-size.yml` owns the hard size gate: compare
`origin/<base>...HEAD` and count **added** lines in `.ts`, `.tsx`, `.mts`, `.cts`.
Every PR must remain at or below 5,000. Match CI's calculation without applying
the exclusions used by the separate advisory 1,200-line reminder. Recalculate
after synchronization or corrections.

Calculate the partition from actual diffs and dependency closure, not workspace
addition totals alone. Record each slice's exact paths, TypeScript additions,
predecessors and verification before committing. Each published branch must
compile and preserve its selected behavior with its own tree. An oversized stack
cannot be made compliant by reporting only its final commit's additions. When a
later slice needs an unmerged predecessor and the cumulative diff exceeds 5,000,
prepare that slice locally and publish it after the predecessor reaches `develop`;
do not change the PR base or weaken the size gate to publish it early.

Publish one coherent PR when within the cap. Otherwise partition along real
product, technical or dependency boundaries, including each slice's tests and
`RF-*`/`CA-*` scope. Do not split arbitrary file/line fragments. Every feature
slice targets `develop`, including a branch derived from an unmerged predecessor.
A dependent PR uses `stacked-pr`; after predecessor merge, merge
`origin/develop`, push and remove the label. Its cumulative diff against
`develop` must also satisfy the cap. If no valid partition exists, adjust the
delivery approach within its contract or route a consequential scope change
through `create-spec` before publishing; do not create a separate execution plan.

1. Fetch without changing user work: `git fetch origin develop --prune`.
2. Find existing delivery PRs, including closed ones, using real Spec/Jira terms.
3. Synchronize the authorized delivery branch with fetched `origin/develop`,
   preserving local changes. If a merge conflicts, invoke
   [resolve-merge-conflicts](../../../documentation/prompts/resolve-merge-conflicts-prompt.md), then inspect its
   resolutions/validation and finish the merge only under existing commit authority.
4. Review the resulting diff and size; reuse the correct existing PR or publish
   every required slice. Record scope, dependency and current check results.

Never rewrite history, force-push, broadly stage or bypass hooks without the
specific authorization required by repository instructions.

Use an isolated worktree for each delivery slice when splitting a shared candidate.
Store task worktrees under the repository-root `.worktrees/` directory, excluded
from version control using a local ignore when necessary. Use descriptive branch
names and honor the user's naming preference; a `codex/` prefix is not required.
Inspect existing worktrees before reusing paths or branches. Preserve the canonical
checkout's merge, staging and unrelated changes. Copy only ignored or untracked
local environment files; never copy tracked environment templates as local data.
Coordinate shared services and serialize fixture-backed integration commands.

## Verification and generated output

Reuse valid implementation results. New commits, review roles and publication
metadata alone do not justify rerunning broad local suites. Follow Tooling for
failed/missing/affected checks; route missing integrated evidence and actual
implementation discrepancies to `implement-spec`, then resume publication after
Evaluation is `ready`. Required check failures must be fixed, not hidden by an
exit code from a different selection. Retain a failing full-suite result even
when its affected focused scenarios later pass. CI runs its full configured gates
independently on each PR head.

Compare the Behavior/Technical Contracts, Create/Modify/Delete commitments,
exclusions and applicable Rules with the diff. Exact contractual paths and
signatures govern conformance; ordinary implementation layout choices do not
require an exhaustive predetermined file tree.

For design-backed UI, confirm Visual Check Results name each required saved
reference and state/viewport, inspected implementation screenshot and concrete
comparison. Use Playwright CLI for concise Manual journeys and rendered captures;
label mocked transport coverage and require real services when contracted.
Console/network, responsive, keyboard, focus and accessibility outcomes must
have explicit dispositions. Required supplemental reference decisions remain
blocking until resolved. Do not recapture valid unaffected states for publication.

When affected, compare migration/snapshot/journal history with `develop`, resolve
number collisions, run the documented generation/verification commands and inspect
SQL/metadata against the contract. Confirm generated routes, exports, lockfiles
and seeds are current and included only when required. Do not hand-edit generated
output to conceal a mismatch or reset shared data to prepare publication.

## Title, language and body

Write authored prose in Brazilian Portuguese (pt-BR), retaining commands, paths,
identifiers, product names and URLs. The title is a concise pt-BR noun phrase,
without Conventional Commit prefix or fabricated issue key. Read the complete
existing title/body and correct stale workflow-authored prose when updating.

Match `.github/pull_request_template.md` headings and order:

| Section | Required content |
| --- | --- |
| Objetivo | Concrete problem and resulting behavior, selected scope/exclusions. |
| Rastreabilidade | Actual Jira keys/URLs or none, canonical PRD, Spec/revision or direct maintenance, Evaluation, covered `RF-*`/`CA-*` and predecessor/`stacked-pr` dependency. |
| Escopo técnico | Create/Modify/Delete table for affected boundaries and concrete paths; previous/new business behavior, permissions, public contracts or persistence and the reason, or an explicit no-change statement. |
| Verificação | Actual Automated, Manual and Visual check IDs, applicable baseline commands/procedures, observed outcomes and artifacts/limits; explain retained candidate evidence and current-head CI. |
| Documentação e limitações | Documentation alignment, open findings, pending/blocked checks, relevant historical failures, explicit waivers and partial delivery or none. |

Keep meaningful Manual prerequisites, concise executable steps and observed
results in the verification table or brief supporting prose. Include contracted
viewports/keyboard paths and Visual comparisons for UI. Link Evaluation for full
commands/artifact details and identify real Auth/REST versus mocked coverage.
Do not add mandatory Manual subsections or a separate Visual evidence section.
Remove unused placeholders and state inapplicable checks honestly. Root
`pnpm lint`/`pnpm check-types` omit application script names; root `pnpm validate`
is not a full delivery gate. Use actual workspace commands recorded in Evaluation
rather than default generic checkboxes.

Keep the body concise, with enough detail to reproduce its claims. Do not add a
generic Changelog, duplicate the Spec, fabricate approvals/results, or introduce
a separate Visual evidence section. Write the exact multiline body to a temporary
file and use `gh pr create/edit --body-file` rather than shell-interpolated prose.

## Publish, CI and return

Push the scoped authorized branch, create/update the PR, and attach every created
or actively updated task PR using `codex_app.attach_artifact` when available.
Read back each PR's full title/body, `baseRefName`, `headRefOid`, `isDraft` and
`statusCheckRollup`. Verify language, scope, base, size and dependencies.

Keep delivery active until every applicable check on each current PR head passes.
Do not finish publication while applicable workflows are pending. Inspect each
failure, fix the owning slice in its worktree, and keep task-owned fixes aligned
with the canonical checkout without overwriting unrelated work or staging. Push
corrections, fetch and synchronize the current `develop` base when needed, then
recalculate the complete PR diff and wait for CI on the new head. CI evidence is
bound to the exact head SHA and is invalidated by later changes to that head.
Use actual checked-in workflow path filters; check expected missing workflows and
report verified inapplicability for skipped checks. Poll `gh pr checks` and current
PR metadata. Pending/cancelled/older-head checks and local results are not a pass.
Inspect failures with `gh run view <run-id> --log-failed`.

Route reproducible in-contract failures through `implement-spec`, then
`commit-code` and this publication workflow. Repeat current-head CI after pushing
corrections; reuse valid local results and follow Tooling for affected reruns.
Same-SHA reruns require evidence of a transient failure. Record original failures
and reruns; do not claim green CI while required checks are missing or failing.
Report a concrete external blocker if it prevents progress.

Return each PR's URL/number, base/head/head SHA, dependency, changed scope and
current terminal check/review state. Return these records to `conclude-spec`
when invoked there; Evaluation's **Delivery** stores final publication/CI facts.
Later reviewer comments use `resolve-pr-pendencies`. Do not merge or deploy.
