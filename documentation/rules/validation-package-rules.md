---
description: Rules for owning, composing, exporting, testing, and consuming reusable Zod schemas through @hms/validation.
---

# Validation Package Rules

These rules apply to `packages/validation` and to application code that defines
or consumes reusable Zod schemas.

`@hms/validation` is the shared runtime-validation boundary for browser forms,
REST input and output, route-search parameters, environment configuration, and
event payloads. It standardizes data shape and syntactic validity; it does not
own authorization, persistence decisions, or business rules.

## Ownership and dependency direction

- Reusable Zod schemas belong in `packages/validation`, not in `apps/web`,
  `apps/server`, or `packages/core`.
- `@hms/validation` may depend on `zod` and `@hms/core`. It must not import an
  application, React, NestJS, Drizzle, Inngest, provider SDKs, browser globals,
  or environment values directly.
- `@hms/core` must never import `@hms/validation`. Core owns domain meaning and
  remains independent of validation libraries.
- Web and server consumers import only declared package subpaths such as
  `@hms/validation/identity`; they must not deep-import
  `packages/validation/src` or bypass a module's public barrel.
- A compatibility module may re-export a shared schema from an established
  application path during migration. It must not duplicate the schema or become
  a second source of truth.

## Schema placement and naming

Mirror the bounded modules and shared concern under `packages/validation/src`:

```text
packages/validation/src/<module>/
├── index.ts
└── schemas/
    ├── index.ts
    ├── <schema-name>-schema.ts
    └── tests/
        └── <schema-name>-schema.test.ts
```

- Use one kebab-case file per reusable schema or tightly coupled schema family.
- Export schemas as `camelCase` constants whose names end in `Schema`.
- Keep reusable primitive schemas in their own files and compose them instead
  of repeating UUID, tax-ID, email, enum, or pagination constraints.
- Re-export public schemas through `schemas/index.ts` and the module `index.ts`.
  Add or update the matching `package.json` export when introducing a module.
- Keep `configure-zod.ts` as the package-owned global Zod configuration boundary;
  applications must not repeat that setup.

## Core structures and enum-like values

When core exposes an `as const` runtime structure, derive the Zod enum directly
from it:

```ts
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import { z } from 'zod'

export const collaboratorProfileSchema = z.enum(CollaboratorProfile)
```

Do not copy core-owned values into a second literal array. A literal Zod enum is
acceptable only when core has no corresponding runtime structure, such as a
validation-package-local configuration mode.

## Consumer boundaries

- Web forms use React Hook Form with `zodResolver` and a schema imported from
  `@hms/validation/<module>`. Form state, submit orchestration, pending state,
  and user feedback remain in the web application.
- Route declarations and URL-state hooks share the same route-search schema or
  parser contract; do not maintain incompatible validators for one parameter.
- Server controllers, jobs, providers, and webhook boundaries parse framework
  input with the shared schema before handing valid data to core use cases.
- Infer request and form types from the schema when it prevents a duplicate
  structural contract. Do not maintain a handwritten type with the same shape.
- Validation may reject malformed input and improve feedback, but it must not
  encode authorization, entity ownership, database existence, workflow state,
  or other business invariants. Those decisions remain in the owning use case.

## Schema tests

Test reusable schemas at the validation-package boundary. Cover valid input,
normalization or defaults, every meaningful invalid branch, and minimum/maximum
boundaries. Prefer focused assertions on issues and paths over snapshots of a
complete Zod error object.

Application tests still cover the user-visible or HTTP behavior that consumes
the schema. A schema unit test does not replace form, controller, route, or
browser coverage.

## Change and validation workflow

When adding or changing a reusable schema:

1. Check for an existing primitive or composed schema.
2. Confirm whether an enum-like value is already canonical in core.
3. Update the schema module, barrels, and package export together.
4. Update every affected web and server consumer in the same change.
5. Run the validation package checks and tests, then the affected consumer
   checks and tests:

```bash
pnpm --filter @hms/validation lint
pnpm --filter @hms/validation check-types
pnpm --filter @hms/validation test
```

If validation behavior changes a product-visible rule, also align the owning
module's PRD, Spec when present, and implementation rules. A schema change alone
does not authorize a business-contract change.
