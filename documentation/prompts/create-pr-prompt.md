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
- Every pull request must target the `develop` branch.

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
  - Technical impact (which of `web` / `server` / `core` is affected)
  - Design decisions taken
  - Risks and side effects
  - **Exact modified paths:** Retrieve the complete, lowest-level file paths of all files created or altered (using `git status` or `git diff`).
  - **Dynamic Codeowners:** For any modified files, run a command like `git log -n 1 --pretty=format:"%ae" -- <file>` or check git history to identify the last author/owner of the modified files, so they can be listed under the alignment section.


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

The PR body must follow the structure defined in `.github/pull_request_template.md`.

**Formatting rules:**
- Use Markdown
- List the exact, full paths of the modified files (at the lowest level possible) under the respective module sections.
- Identify and list the original authors/codeowners of each modified file using `git log` or `git blame` history, under the alignment section.

---

## 📝 Descrição das Alterações (obrigatório)
Explique por que este PR foi criado, qual é seu propósito principal e quais problemas ele resolve.

## 🛠️ Módulos e Caminhos Específicos Afetados (Obrigatório)
Enumere os módulos afetados e liste os caminhos de todos os arquivos ou pastas específicas criados/modificados:
- [ ] `apps/web` (Frontend / Interface)
  *Arquivos alterados:* 
  - (Caminho completo de cada arquivo...)
- [ ] `apps/server` (Backend / API)
  *Arquivos alterados:* 
  - (Caminho completo de cada arquivo...)
- [ ] `packages/core` (Regras de Domínio)
  *Arquivos alterados:* 
  - (Caminho completo de cada arquivo...)
- [ ] `supabase` (Banco de dados / Migrations / Seeders)
  *Arquivos alterados:* 
  - (Caminho completo de cada arquivo...)

## ⚠️ Alinhamento com Codeowners / Autores Original dos Módulos (Obrigatório)
Identifique e liste os autores originais de cada arquivo que você alterou (consulte o histórico do Git):
- [ ] Identifiquei os autores originais dos arquivos alterados:
  * `caminho/do/arquivo` -> Autor/Codeowner
- [ ] Eu alinhei/conversei com os criadores/autores antes de realizar e submeter estas alterações.
  - *Detalhes do alinhamento:* ...


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
  --base develop \
  --head <branch-name> \
  --title "<PR title>" \
  --body-file pr_body.md
```

Or inline:

```
gh pr create \
  --base develop \
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
