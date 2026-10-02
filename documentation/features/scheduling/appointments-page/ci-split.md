# PR #191 CI delivery split

The `check-size` failure on head `ca5f0cc0` counted 8,757 added TypeScript lines.
PR #183 had been merged into the Server delivery branch, combining the Server
and Web slices despite the Server-only scope of PR #191.

The correction preserves the existing 5,000-line limit and all implementation:

1. PR #191 (`codex/agenda-server`, based on `codex/agenda-core-validation`)
   retains the Server API, persistence, migrations and seed changes: 3,801 added
   TypeScript lines. Its application source matches the previously validated
   Server-only head `00791614`.
2. A dependent Web PR (`codex/agenda-web-ci`, based on `codex/agenda-server`)
   restores the shared lawyer selector, Agenda UI and route tests: 4,956 added
   TypeScript lines. Its application source matches the original integrated
   head `ca5f0cc0`.

Spec revision 13, its product requirements and recorded validation limitations
remain unchanged. Existing visual and authenticated-browser evidence in
`evaluation.md` applies to the unchanged integrated application source; splitting
the Git delivery does not constitute a new browser validation pass.

No existing commit is rewritten. The split uses a scoped reversal on the Server
branch and a restoration on the dependent Web branch. Merge PR #191 into its
declared base before integrating the dependent Web slice.
