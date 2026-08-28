---
name: create-prd
description: Create or refine a canonical Confluence Product Requirements Document from an approved product problem, grounded in repository ownership and implementation reality.
---

# Create or Refine a PRD

Create or refine one canonical Product Requirements Document for HMS. The PRD is the product
authority for outcomes, actors, capabilities, journeys, constraints, and exclusions. Do not
create a repository-local `prd.md` substitute.

This workflow may prepare a draft locally or in the task context, but it may create or update
Confluence only with explicit user authorization. It must not create Jira tickets, Specs, Plans,
branches, commits, or pull requests as a side effect.

## Authority and research

Before writing:

1. Read `AGENTS.md`, `AGENTS.local.md`, `documentation/rules/rules.md`, and every applicable
   Rule selected from the affected product and technical boundaries.
2. Read `documentation/modules.md`, `documentation/architecture.md`, and
   `documentation/tooling.md` when the product decision touches those authorities.
3. Search Atlassian HMS for the canonical parent, related PRDs, Jira tickets, decisions, and
   duplicate product requirements; read complete canonical pages before relying on them.
4. Inspect the current implementation and tests only to establish facts, gaps, constraints,
   and ownership. Do not let current behavior silently become intended product behavior.

Facts belong to the Orchestrator. Look them up or dispatch bounded read-only research; do not
ask the user for repository or Atlassian facts that can be verified.

## Grilling gate

After fact-finding and before creating or updating the PRD, apply the `grilling` protocol from
[`grilling-prompt.md`](./grilling-prompt.md): build the design tree, compute the current
frontier, ask every frontier decision in one numbered round with a recommendation, recompute
after each answer, and wait for explicit confirmation of shared understanding. Do not write or
mutate the PRD while a material branch remains unresolved.

At minimum, grill unresolved decisions about the problem and measurable outcome, actors and
permissions, primary journeys and states, success and rejection behavior, scope and non-goals,
dependencies, rollout constraints, and how product success will be observed. Reuse established
authority when it already resolves a decision; do not ask the user to re-decide settled facts.

## Required PRD content

Capture only resolved product intent:

- problem and measurable outcome;
- actors, roles, permissions, and affected modules;
- capabilities and primary user journeys;
- success, loading, empty, error, rejection, cancellation, and recovery states when relevant;
- business rules and invariants expressed without implementation-level contracts;
- dependencies, risks, rollout constraints, and operational considerations;
- explicit scope, non-goals, and deferred outcomes;
- related design references, Jira tickets, decisions, and canonical links.

Keep technical implementation details in the Spec. Link to repository authorities rather than
duplicating their rules. Distinguish confirmed decisions, accepted assumptions, deferred scope,
and unresolved questions; the last category must be empty before publication.

## Validation before publication

Verify that every in-scope outcome has an actor, observable success condition, failure or
recovery treatment where applicable, ownership boundary, and traceable source. Check for
duplicate or conflicting PRDs and surface conflicts before publication. Present the complete
proposed PRD and its authority/traceability map for final user confirmation when the user has
not already authorized the exact content.

After explicit authorization, create or update the canonical Confluence page and return its
URL, title, parent, changed sections, linked Jira tickets, decisions resolved through grilling,
accepted assumptions, and deferred scope. Do not change Jira workflow state automatically.
