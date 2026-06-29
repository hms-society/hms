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
- in English
- a reflection of the essence of the change
- preferably a **noun phrase** (do not start with a verb)

Prefer noun-phrase formulations such as:

- `Setup of...`
- `Coverage of...`
- `Fix for...`
- `Adjustment of...`
- `Refactor of...`

Examples:

- `Product listing setup`
- `Fix for the image loading error`
- `Fix for navigation to the catalog screen`
- `Integration test coverage for the sign-up page`

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

## Goal (required)

Explain why this PR was created and its core purpose.

## Related issues (optional)

Link tasks/bugs using **only** the `resolve` keyword:

```
resolve #123
resolve #456
```

⚠️ Do not use `closes`, `fixes`, or any other variation. Only `resolve`.

---

## Bug cause (optional — fix only)

Describe the technical root cause.

---

## Changelog (required)

Technical list of the changes:

- files changed
- behavior modified
- rules added
- refactors performed

---

## How to test (required)

Clear step-by-step for the reviewer to validate. Reference the relevant commands,
e.g.:

```
pnpm install
pnpm --filter web dev        # frontend at http://localhost:3000
pnpm --filter server start:dev
pnpm --filter <pkg> check-types
```

1. …
2. …
3. …

---

## Notes (optional)

- architecture decisions
- known limitations
- tradeoffs
- next steps

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
