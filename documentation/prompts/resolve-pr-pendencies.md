---
description: Prompt for resolving open PR pendencies via gh, including review comments, CI failures, local validation, and PR updates.
---

# Prompt: Resolve PR Pendencies

**Goal:** Standardize how to resolve open pendencies in a Pull Request (PR),
including reviewer feedback, CI/CD failures, and local validation before updating
the branch. The workflow relies exclusively on the **GitHub CLI (gh)** for GitHub
interactions.

---

## Input

- A PR number or URL.
- The local branch associated with the PR, or permission to fetch/check it out.
- Open pendencies such as:
  - review comments
  - requested changes
  - failing CI/CD workflows
  - merge conflicts
  - missing validation

---

## Project Context

This is a pnpm + Turborepo monorepo:

- `apps/web` — TanStack Start + React frontend (Tailwind v4, shadcn/ui)
- `apps/server` — NestJS backend
- `packages/core` — shared domain (entities, errors, events) consumed by both apps

Commits follow **Conventional Commits**, enforced by commitlint + husky.

---

## Execution Guidelines

### 1. Inspect the PR State

Use **gh** to collect the current PR context before making changes.

Recommended commands:

```bash
gh pr view <pr-number> --json number,title,body,headRefName,baseRefName,author,reviewDecision,isDraft,mergeStateStatus,statusCheckRollup
gh pr diff <pr-number>
gh pr checks <pr-number>
gh pr view <pr-number> --comments
```

Identify:

- the purpose and scope of the PR
- which workspaces are affected (`web`, `server`, `core`)
- unresolved review feedback
- failing or missing checks
- whether the branch is behind `main` or has merge conflicts

For review conversations/threads that must be inspected or resolved precisely,
use the **GitHub GraphQL API through `gh api graphql`**.

⚠️ Do **not** use GitHub MCP or any MCP API for PR actions. Use **gh**
exclusively, including GraphQL access through `gh api graphql`.

---

### 2. Classify the Pendencies

Separate the pendencies into objective groups:

- **review feedback** — requested changes, inline comments, discussion points
- **CI/CD failures** — lint, typecheck, test, build, e2e, or workflow errors
- **integration issues** — merge conflicts, outdated branch, incompatible changes
- **validation gaps** — missing local reproduction or incomplete test coverage

For each pendency, define:

- root cause
- affected files/modules
- expected fix
- how it will be validated locally

If a reviewer comment is ambiguous, state the ambiguity explicitly instead of
guessing.

---

### 3. Implement the Fixes

Resolve the pendencies with the smallest coherent change set possible.

Priorities:

1. restore branch correctness
2. fix failing checks
3. address requested review changes
4. improve coverage or validation where needed

While implementing:

- preserve the architectural boundaries documented for the monorepo
- do not introduce new libraries if the existing stack already covers the concern
- keep changes scoped to the PR objective unless a broader fix is required
- if a pendency reveals a deeper issue, document the tradeoff in the PR update

---

### 4. Update the Branch

Synchronize the branch only after understanding the PR state.

Typical flow:

```bash
git status
git branch --show-current
git fetch origin
git checkout <branch-name>
git pull --rebase origin <branch-name>
```

If the PR branch needs to be updated with `main`:

```bash
git fetch origin
git rebase origin/main
```

If conflicts occur:

- resolve them intentionally
- re-run the relevant validations
- continue the rebase only after the branch is consistent

⚠️ Do not use destructive git commands such as `git reset --hard`.

---

### 5. Validate Locally

Before pushing, run the relevant local checks for the affected workspaces.

Prefer the documented commands, for example:

```bash
pnpm check
pnpm check-types
pnpm --filter web test
pnpm --filter server test
pnpm --filter server test:e2e
pnpm build
```

Use narrower `--filter` targets when the scope is limited and that is sufficient
to validate the change.

Record:

- which commands were executed
- which ones passed
- which ones could not be run and why

---

### 6. Commit and Push

After the fixes are validated:

```bash
git status
git add .
git commit -m "<type>(<scope>): <subject>"
git push -u origin <branch-name>
```

Rules:

- commit messages must follow **Conventional Commits**
- do not bypass hooks with `--no-verify`
- if the branch already exists remotely, a regular `git push` is enough
- if the branch was rebased, push with the minimum safe command required by the
  situation

---

### 7. Resolve Review Conversations

When a change addresses a reviewer thread, resolve the corresponding PR
conversation using the **GitHub GraphQL API through `gh`**.

Preferred flow:

1. Fetch the PR node id and review threads:

```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        id
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            comments(first: 20) {
              nodes {
                id
                body
                author {
                  login
                }
                path
              }
            }
          }
        }
      }
    }
  }
' -F owner=<owner> -F repo=<repo> -F number=<pr-number>
```

2. Identify the thread ids that were fully addressed.

3. Resolve each addressed thread with the GraphQL mutation:

```bash
gh api graphql -f query='
  mutation($threadId: ID!) {
    resolveReviewThread(input: {threadId: $threadId}) {
      thread {
        id
        isResolved
      }
    }
  }
' -F threadId=<thread-id>
```

Rules:

- resolve only threads whose feedback was actually addressed
- do not resolve threads that still need discussion or follow-up
- if needed, reply first and resolve afterward
- if a thread was resolved by mistake, reopen it with GraphQL rather than leaving
  the PR in an inconsistent state

To reopen a thread:

```bash
gh api graphql -f query='
  mutation($threadId: ID!) {
    unresolveReviewThread(input: {threadId: $threadId}) {
      thread {
        id
        isResolved
      }
    }
  }
' -F threadId=<thread-id>
```

---

### 8. Update the PR

After pushing, verify the new PR state:

```bash
gh pr checks <pr-number>
gh pr view <pr-number> --comments
```

If useful, add a concise PR comment summarizing:

- what was fixed
- which reviewer points were addressed
- which local validations were executed
- any remaining limitation or follow-up

Example:

```bash
gh pr comment <pr-number> --body "Pendencias resolvidas: ajustes nos comentarios de revisão, correção dos checks e validação local executada."
```

If a review thread requires a direct reply, respond clearly and objectively using
`gh`.

---

### 9. Return

Report back with:

- resolved pendencies
- files or modules affected
- local commands executed
- final PR status after the push
- resolved or reopened review thread ids, when applicable
- remaining risks, blockers, or follow-ups, if any

If the PR is still not ready to merge, state exactly what remains open.
