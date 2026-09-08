---
description: Rules for the shared Zod validation package and its type-check-only boundary.
---

# Validation Package Rules

`packages/validation` owns shared Zod schemas that describe transport and input
shapes. It is a contract package, not a behavior-owning application boundary.

## Keep the package test-free

Do not create or retain test files, a `test` script, or a `test:coverage` script
in `packages/validation`. The package is intentionally validated with:

```bash
pnpm --filter @hms/validation lint
pnpm --filter @hms/validation check-types
```

Behavior-focused tests belong at the consuming core, server, or web boundary,
where the schema's effect on an application action can be observed. Do not add
placeholder tests solely to make the validation package appear in the test or
coverage task graph.

## Keep schema ownership clear

Validation schemas may describe parsing, coercion, and transport constraints,
but must not implement domain decisions or application workflows. Import
canonical domain values from `packages/core` when a schema represents a closed
domain set; do not duplicate literals that core already owns.

When a schema change affects a consumer, update that consumer's behavior-focused
tests and run the covered workspace test/coverage commands. The validation
package itself remains linted and type-checked without a test suite.
