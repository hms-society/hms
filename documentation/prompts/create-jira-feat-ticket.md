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

## Language requirement

Write the entire Jira ticket in Brazilian Portuguese (`pt-BR`). This applies to
the summary, description headings, prose, lists, acceptance criteria,
out-of-scope items, references, and every other human-authored ticket field.

Keep technical identifiers unchanged when translation would make them inaccurate,
including code symbols, file paths, API routes, Jira keys, product names, official
document titles, and existing Jira-native option values. Do not use English section
headings or boilerplate in the ticket. Write the completion report in `pt-BR` too.

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

## Grilling gate

After fact-finding and before writing or creating the ticket, apply the `grilling` protocol
from [`grilling-prompt.md`](./grilling-prompt.md). Build a design tree of the ticket's
decisions, compute the current frontier, and ask the whole frontier in one numbered round using
the required `❓`/`➡️` format and a recommendation for every question. Recompute the frontier
after each answer and ask only questions whose prerequisites are settled.

At minimum, grill unresolved decisions about the actor and outcome, scope and exclusions,
permissions, acceptance and failure behavior, technical boundary, validation expectations,
whether one ticket is the right decomposition, sprint, and assignee. Look up repository and
Jira facts or dispatch bounded read-only research; never ask the user for facts that can be
verified. Do not write the ticket or mutate Jira while any material branch remains unresolved.
After the frontier is empty, obtain the user's explicit confirmation that shared understanding
is complete before creating the ticket. Record resolved decisions and accepted assumptions in
the ticket, not the interview transcript.

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
connected Jira workspace and repository instructions. Confirm the project and ticket
type before creating the ticket when either materially changes routing or ownership.
Never create a label, project, sprint, user, or custom field as part of this prompt.

Before creating the ticket, ensure the grilling rounds have explicitly settled both questions:

1. Which existing sprint should the ticket belong to, or should it remain without a
   sprint?
2. Which existing Jira user should be assigned, or should it remain unassigned?

If the initial request already answers either question unambiguously, reuse that
answer and ask only for the missing one. Do not infer sprint or assignee from similar
tickets, project defaults, the current user, repository ownership, or prior Jira
activity. Resolve the supplied sprint and user against Jira before creation; if a
value does not identify an existing option, ask the user to choose again. Create the
ticket only after both choices are explicit and valid.

Search for similar Jira tickets before creating the new one to avoid duplicates.
Do not change the status, assignee, sprint, or content of existing tickets unless
the user explicitly requests it.

## Ticket summary

Use this format:

```text
Implementar <nome curto da funcionalidade>
```

The summary must describe the outcome, not an implementation detail. Keep it
concise and avoid duplicating the project, sprint, or parent ticket name.

## Ticket description

Use the following structure:

```md
## Objetivo

<Resultado para o usuário ou para o negócio que esta funcionalidade viabiliza.>

## Contexto

<Requisito relevante do PRD, comportamento atual, fronteira arquitetural e
restrições. Vincule o PRD aplicável e os tickets Jira relacionados.>

## Escopo

- <Comportamento visível ao usuário incluído.>
- <Comportamento de Core, Server, persistência, integração ou mensageria incluído.>
- <Páginas Web, rotas, estados ou acessibilidade incluídos quando aplicável.>

## Requisitos técnicos

### Core

- <Contratos de domínio e casos de uso, quando aplicável.>

### Server

- <Controllers, repositórios, adaptadores, jobs ou autorização, quando aplicável.>

### Web

- <Rotas, páginas, contextos, serviços ou estados de interface, quando aplicável.>

### Validação

- <Verificações obrigatórias de unidade, integração, navegador, tipos, lint ou build.>

## Critérios de aceite

- [ ] <Comportamento de sucesso observável.>
- [ ] <Comportamento de validação e erro.>
- [ ] <Comportamento de autorização e isolamento de tenant, quando aplicável.>
- [ ] <Comportamento responsivo e acessível, quando aplicável.>
- [ ] <Testes relevantes aprovados.>

## Fora do escopo

- <Funcionalidades adjacentes explicitamente excluídas.>

## Referências

- PRD: <URL ou caminho do PRD canônico>
- Design: <arquivo Pencil/Figma, URL ou IDs de nós, quando aplicável>
- Tickets Jira relacionados: <chaves Jira, quando aplicável>
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
