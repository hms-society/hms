---
name: create-jira-feat-ticket
description: Create a scoped Jira feature ticket from a Confluence PRD or feature request, grounded in repository rules, product traceability, and the current implementation.
---

# Prompt: Create Jira Feature Ticket

## Objective

Transform a product requirement or feature request into one clear, actionable Jira
feature ticket for the current repository.

The result of this task is one Jira feature ticket. Do not implement code, create a
branch, or open a pull request.

## Input

- **Feature request:** the requested capability or product outcome.
- **Context (optional):** affected module, user role, workflow, technical
  constraint, related PRD, design reference, or related Jira ticket.

If the request is ambiguous, inspect the repository documentation and code for
evidence before asking for clarification. Do not invent product behavior that is
not supported by the request or the applicable PRD.

## Required repository context

Before writing the ticket:

1. Read `AGENTS.md` and any applicable nested instruction files.
2. Read `documentation/rules/rules.md` and select every rule relevant to the feature.
3. Read `documentation/architecture.md` when the feature affects system
   boundaries, persistence, authentication, authorization, integrations, or
   asynchronous processing.
4. Read `documentation/modules.md` to identify the owning module.
5. Read the owning PRD and its canonical source under the repository's approved
   documentation location.
6. Inspect relevant existing source files and tests when technical scope needs to
   be grounded in the current implementation.

## Jira metadata

Create the ticket with the repository- and project-approved values:

- **Project:** `<PROJECT_KEY>`
- **Type:** the repository-approved feature delivery type, normally `Task`
- **Summary:** `<short, outcome-oriented title>`
- **Sprint:** `<name or number, when applicable>`
- **Assignee:** `<Jira user, when applicable>`
- **Labels:** `<existing labels only>`
- **Priority:** `<priority, when applicable>`
- **Parent or epic:** `<key, when applicable>`
- **Related tickets:** `<Jira keys, when applicable>`

Discover available projects, fields, workflows, labels, and conventions from the
connected Jira workspace and repository instructions. Confirm the project, ticket
type, sprint, and assignee before creating the ticket when any of them materially
changes routing or ownership. Never create a label, project, sprint, user, or
custom field as part of this prompt.

Search for similar Jira tickets before creating the new one to avoid duplicates.
Do not change the status, assignee, sprint, or content of existing tickets unless
the user explicitly requests it.

## Ticket summary

Use this format:

```text
Implement <short feature name>
```

The summary must describe the outcome, not an implementation detail. Keep it
concise and avoid duplicating the project, sprint, or parent ticket name.

## Ticket description

Use the following structure:

```md
## Goal

<The user or business outcome this feature enables.>

## Context

<Relevant PRD requirement, current behavior, architectural boundary, and
constraints. Link the applicable PRD and related Jira tickets.>

## Scope

- <User-visible behavior included.>
- <Server, core, persistence, integration, or messaging behavior included.>
- <Web pages, routes, states, or accessibility behavior included when applicable.>

## Technical requirements

### Core

- <Domain contracts and use cases, if applicable.>

### Server

- <Controllers, repositories, adapters, jobs, or authorization, if applicable.>

### Web

- <Routes, pages, contexts, services, or UI states, if applicable.>

### Validation

- <Required unit, integration, browser, type, lint, or build checks.>

## Acceptance criteria

- [ ] <Observable success behavior.>
- [ ] <Validation and error behavior.>
- [ ] <Authorization and tenant-isolation behavior, if applicable.>
- [ ] <Responsive and accessible behavior, if applicable.>
- [ ] <Relevant tests pass.>

## Out of scope

- <Explicitly excluded adjacent features.>

## References

- PRD: <canonical PRD URL or path>
- Design: <Pencil/Figma file, URL, or Node IDs, when applicable>
- Related Jira tickets: <Jira keys, when applicable>
```

Omit technical subsections that do not apply. Keep acceptance criteria observable
and testable. Separate required behavior from implementation ideas. Do not copy
sensitive report contents or credentials into the ticket.

## Scope rules

- Create exactly one Jira feature ticket for the request unless the user explicitly
  asks for decomposition.
- Keep the ticket small enough to implement and review as one coherent change.
- Preserve the owning module's boundaries from `documentation/modules.md`.
- Put business rules in `packages/core`; describe application adapters in the
  ticket only when the feature needs them.
- Treat the backend as authoritative for permissions, pricing, stock, tenancy,
  and other business decisions.
- Do not include public sign-up or establishment onboarding in authentication
  tickets unless explicitly requested; those belong to Identity REQ-01.
- Do not add unrelated cleanup, speculative future work, or unrequested
  dependencies.
- Do not claim that a requirement is implemented; this prompt only defines and
  creates the ticket.

## Completion

After creating the ticket, report:

- Jira ticket key and URL.
- Summary.
- Project, type, parent/epic, sprint, and assignee.
- Labels and priority.
- A one-sentence summary of the scope.
- Any field that could not be filled and why.
