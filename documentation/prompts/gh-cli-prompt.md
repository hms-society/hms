---
name: gh-cli
description: Use authenticated GitHub CLI for repository, pull-request, issue, review and workflow operations.
---

# GitHub CLI

Use this procedure for GitHub repositories, PRs, issues, reviews and workflow
results. Prefer local Git for local state and source inspection.

## Authenticate and inspect

Run `gh auth status` before private or elevated remote access. Use authenticated
`gh` commands or `gh api` instead of unauthenticated HTTP or MCP fetches. Inspect
`gh <command> --help` when an installed CLI does not support an option or JSON
field; use authenticated `gh api` for the equivalent operation.

Examples:

```bash
gh auth status
gh repo view owner/repository
gh pr view 123 --repo owner/repository
gh api repos/owner/repository/pulls/123
gh pr checks 123 --repo owner/repository
gh run view 456 --repo owner/repository --log-failed
```

Read complete PR title/body, base, exact head SHA and current-head checks before
publication or review conclusions. Use local source rather than the GitHub
contents API as a filesystem; clone when complete remote source is needed.

## Preserve authorization and work

Reuse existing user authorization for commits, pushes and PR changes. Read-only
access does not authorize external mutations. Do not merge, deploy, rewrite
history, bypass hooks or change branch protection as a publication side effect.
Keep credentials and local runtime/authentication artifacts private.

Write multiline PR descriptions to a temporary file and pass `--body-file`.
After creating or updating a task PR, read it back and attach its URL to the
current task when the application provides that capability. Follow repository
instructions for review requests; do not automatically request `@codex review`.
