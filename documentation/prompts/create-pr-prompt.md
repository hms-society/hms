---
description: Prompt for creating standardized pull requests via gh, with a clear noun-phrase title, structured body, and validation checklist.
---

# Prompt: Create PR

**Goal:** Standardize the creation of Pull Requests (PRs), ensuring clear
descriptions that make code review and task tracking easier. The workflow relies
exclusively on the **GitHub CLI (gh)** to keep the process consistent.

---

## Input

- A Spec (specification) that has been implemented and validated.
- A Bug Report that has been implemented and validated.
- A `feat/`, `fix/`, or `refactor/` branch with the changes committed.

---

## Project Context

This is a pnpm + Turborepo monorepo:

- `apps/web` — TanStack Start + React frontend (Tailwind v4, shadcn/ui)
- `apps/server` — NestJS backend
- `packages/core` — shared domain (entities, errors, events) consumed by both apps

Commits follow **Conventional Commits**, enforced by commitlint + husky. PR titles,
however, are written as plain noun phrases **without a type prefix** (see below).

---

## Execution Guidelines

### 1. Context Analysis

- Review the implemented Spec and the changelog of the changes made.
- Identify:

  - technical impact (which of `web` / `server` / `core` is affected)
  - design decisions taken
  - risks and side effects

---

### 2. Title Definition

The title must be:

- short and direct
- **in Brazilian Portuguese (PT-BR)**
- a reflection of the essence of the change
- preferably a **noun phrase** (do not start with a verb)

Prefer noun-phrase formulations such as:

- `Configuração de...`
- `Cobertura de...`
- `Correção de...`
- `Ajuste de...`
- `Refatoração de...`

Examples:

- `Configuração da listagem de produtos`
- `Correção do erro de carregamento de imagem`
- `Correção da navegação para a tela de catálogo`
- `Cobertura de testes de integração da página de cadastro`

⚠️ Do **not** add any prefix to the title — neither branch-style prefixes nor
Conventional Commits types:

```
feat/        feat(scope):
fix/         fix:
refactor/    chore:
```

---

### 3. Body Structure

The PR body must follow the template below.

**Formatting rules:**

- use Markdown
- do not use a top-level `#` heading
- use `##` and lower levels

---

## Objetivo (obrigatório)

Explique por que este PR foi criado e qual é seu propósito principal.

## Issues relacionadas (opcional)

Vincule tarefas/bugs usando **apenas** a palavra-chave `resolve`:

```
resolve #123
resolve #456
```

⚠️ Não use `closes`, `fixes` ou qualquer outra variação. Apenas `resolve`.

---

## Causa do bug (opcional — apenas para correções)

Descreva a causa técnica raiz do problema.

---

## Changelog (obrigatório)

Lista técnica das alterações realizadas:

- arquivos modificados
- comportamentos alterados
- regras adicionadas
- refatorações realizadas

---

## Como testar (obrigatório)

Passo a passo claro para o revisor validar as mudanças. Referencie os comandos
relevantes, ex.:

```
pnpm install
pnpm --filter web dev        # frontend em http://localhost:3000
pnpm --filter server start:dev
pnpm --filter <pkg> check-types
```

1. …
2. …
3. …

---

## Observações (opcional)

- decisões de arquitetura
- limitações conhecidas
- tradeoffs
- próximos passos

---

### 4. Commit and Push

Before opening the PR, make sure all changes are committed and the branch is pushed
to the remote — `gh pr create` opens a PR from commits that already exist on the
remote branch, so uncommitted or unpushed work will not be included.

1. Check the working tree:

   ```
   git status
   ```

2. Stage and commit any pending changes. Commit messages **must** follow
   **Conventional Commits** (enforced by commitlint + husky):

   ```
   git add .
   git commit -m "<type>(<scope>): <subject>"
   ```

3. Push the branch to the remote (first push sets the upstream):

   ```
   git push -u origin <branch-name>
   ```

⚠️ Do not skip the hooks (e.g. `--no-verify`) — the commit must pass commitlint.

---

### 5. Creation via gh CLI

⚠️ Do not use the GitHub MCP. ⚠️ Do not use MCP APIs. Use **gh** exclusively.

Standard command:

```
gh pr create \
  --base main \
  --head <branch-name> \
  --title "<PR title>" \
  --body-file pr_body.md
```

Or inline:

```
gh pr create \
  --base main \
  --head <branch> \
  --title "<PR title>" \
  --body "<formatted description>"
```

---


### 7. Return

After creation:

```
gh pr view --web
```

or

```
gh pr view --json url
```

Return:

- link to the created PR
- final title
- summary of the generated body
