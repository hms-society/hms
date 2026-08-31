---
description: Source organization rules for the shared core domain package.
---

# Core Package Rules

These rules apply to TypeScript source files under `packages/core`.

## One exported type per file

Every declaration written with `export type` must live in its own source file.
The filename must describe that exported type using kebab-case.

Do not declare two or more exported types in the same file:

```ts
// legal-catalog.ts — invalid
export type LegalArea = {
  id: string
  name: string
}

export type LegalTopic = {
  id: string
  name: string
}
```

Create one file for each exported type instead:

```ts
// legal-area.ts
export type LegalArea = {
  id: string
  name: string
}
```

```ts
// legal-topic.ts
export type LegalTopic = {
  id: string
  name: string
}
```

Non-exported helper types may remain in the file where they are used. Barrel files named
`index.ts` must only re-export declarations and must not declare types of their own.

## Domain faker conventions

Test-data builders for core entities and structures belong in a `fakers`
directory under the owning domain kind. Name new and materially changed builders
`<DomainType>Faker` and implement them as classes:

```ts
export class ClientFaker {
  static fake(overrides: Partial<Client> = {}): Client {
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      ...overrides,
    }
  }

  static fakeMany(count = 10): Client[] {
    return Array.from({ length: count }, () => ClientFaker.fake())
  }
}
```

Every new or materially changed entity faker exposes `static fake(overrides)`
and `static fakeMany(count)`. A structure faker may omit `fakeMany` when a
collection has no meaningful test use, but must still expose
`static fake(overrides)`. Use `@faker-js/faker` for identity and realistic values,
keep defaults valid, and apply overrides last. When records are related, override
their identifiers explicitly so the fixture cannot create an incoherent
relationship.

Fakers are test-data builders only. They must not contain business decisions or
live in production entities, use cases, interfaces, or application layers.
Export them from the nearest `fakers/index.ts` barrel. Tests use the canonical
faker and keep only scenario-specific overrides instead of scattering complete
handwritten domain objects or local `fake<Entity>()` helpers.

## Business rules belong to use cases

Every business rule in `packages/core` must be implemented exclusively inside a
use case class under the owning module's `use-cases` directory.

Entities and structures describe domain state and valid data shapes. They must not
implement business decisions through methods, exported functions, computed getters,
validators, policies, specifications, or rule objects.

Do not create `domain/rules`, `domain/policies`, or `domain/services` directories to
hold business rules. For example, whether a document package can be confirmed must
be checked by a `ConfirmDocumentPackage` use case class, not by a
`canConfirmDocumentPackage` function.

Use cases may coordinate entities, structures, interfaces, errors, and events while
enforcing the rules required by one application action. Keep one exported use case
class per file and use a verb-led name that describes the action.

## Enum-like domain structures are canonical

When a closed set of domain values is represented by an `as const` structure, that
structure and its derived type are the canonical definitions for the whole system.
Consumers must import them from the owning core module instead of repeating string
literal unions or arrays whenever that import is possible.

This applies to use-case requests, entities, events, validation schemas, jobs, REST
adapters, UI mappings, and tests. Zod schemas must build enums directly from the
domain structure, for example `z.enum(ConsultationModality)`, rather than copying its
values into a new array. Infrastructure declarations that cannot consume runtime
domain structures, such as literal SQL check constraints, may repeat the persisted
values but must remain synchronized with the canonical structure.

## Contracts belong to interfaces directories

Every contract exposed by `packages/core` must live in an `interfaces` directory
under the module that owns it. Never create a directory named `providers` inside
`packages/core`.

This rule applies to provider, repository, gateway, storage, and other contracts
implemented outside the core. Their declaration names must continue to describe
their specific roles, such as `ClientLookupProvider`, `DocumentBatchRepository`, or
`FileStorageProvider`; `interfaces` is the name of the organizational directory,
not a required suffix for each contract.

Place a contract in `shared/interfaces` only when it is intentionally shared by
multiple modules. An `interfaces/index.ts` barrel must only re-export declarations.
Implementations and infrastructure-specific details must remain outside
`packages/core`.

Identity authentication follows the same separation:

- `AuthProvider` is the behavioral contract and belongs in
  `packages/core/src/identity/interfaces`;
- `AuthCredentials`, `AuthSession`, `AuthStateChange`,
  `AuthStateChangeListener`, and `AuthUser` are shared data structures and belong
  in `packages/core/src/identity/domain/structures`;
- Supabase implementations belong in an application provision layer, not in the
  core package.

Consumers must import auth data structures from the structures barrel and the
provider contract from the interfaces barrel. Do not place provider-specific
types or Supabase imports in `packages/core`.

## Entity identity and composition

Only domain entity declarations may own a local identity. An entity is represented
as a type alias composed with the shared `Entity` type:

```ts
import type { Entity } from '#shared/domain/entities/entity'

export type Intake = Entity & {
  clientId: string
  status: IntakeStatus
  createdAt: Date
}
```

`Entity` is a type, not an interface or class, and is the only owner of the
identity property:

```ts
export type Entity = {
  readonly id: string
}
```

Entity files must therefore:

- use `export type`, not `export interface`;
- compose `Entity` with `Entity & {...}` or through a private base type that
  already composes it;
- never redeclare `id` locally;
- keep their own fields mutable, without `readonly`. The identity remains
  readonly because it is defined that way by `Entity`;
- preserve this composition in discriminated unions by putting `Entity` on the
  shared base type.

A structure represents a value, state, configuration, or relationship without an
identity of its own and normally must not declare a local `id`. If a domain concept
needs an `id` so it can be referenced, edited, removed, or tracked independently,
model it as an entity instead of a structure. Do not remove a necessary identity
merely to keep the declaration in `structures`.

Creation, update, summary, and projection types are separate contracts. They do
not compose `Entity` merely because they are stored in an `entities` directory;
use `Omit`, `Pick`, or a dedicated type for their input or read-model shape.
Structures may contain explicitly named references to entities, such as
`consultationId` or `legalAreaId`. External identity projections are the narrow
exception: `AuthUser` may expose the provider's subject `id` because it represents
an external authentication identity, not a core aggregate entity. No other
structure should add a bare `id` field without documenting the same external
identity rationale.

## Structure mutability is semantic

Structures do not receive `readonly` mechanically. Each structure must express the
mutability of the value it represents:

- use mutable fields when callers are allowed to assemble, normalize, or update that
  value in memory;
- use `readonly` fields when mutation would violate the contract, such as an immutable
  snapshot, historical record, published event payload, or fixed configuration;
- use `readonly T[]`, `ReadonlyArray<T>`, tuples with `readonly`, or nested
  `Readonly<T>` only when nested collection/object mutation must also be prohibited;
- do not infer deep immutability from a top-level `readonly` property, because
  TypeScript's `readonly` modifier is shallow;
- do not add `readonly` merely because a declaration is stored under `structures` or
  is passed as a use-case request, response, projection, filter, or update shape.

The declaration must make the semantic choice visible. If a structure is intentionally
immutable, apply `readonly` consistently to every field and nested value covered by
that guarantee. If it is intentionally mutable, omit `readonly`; do not mix modifiers
without a field-specific reason.

## Antipatterns to Avoid

### Adding `readonly` to every Structure field

**Prohibited:** treating `readonly` as a directory convention and adding it to every
field of every type under `domain/structures`.

**Required alternative:** decide mutability from the structure's domain role. Reserve
`readonly` for contracts that must be immutable and model the required depth explicitly;
leave ordinary mutable request, update, filter, response, projection, and working-value
fields without it.

**Validation:** inspect the resulting declaration against its consumers and immutable
boundary, then run `pnpm --filter @hms/core check-types`. Type checking proves that the
chosen modifiers are compatible with consumers; the contract review proves that the
choice matches the domain semantics.
