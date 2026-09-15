---
description: NestJS layer-module boundaries for feature-owned provision, messaging, and AI adapters.
---

# Server App Layer Rules

These rules apply to technical layers owned by feature modules under
`apps/server/src/<module>`.

The Server application layer composes Core contracts with infrastructure. Feature
modules may register adapters, providers and technical submodules, but they must
not move business rules into Nest modules or bypass Core interfaces. Cross-module
dependencies are assembled through exported ports/providers and public module
contracts; a feature module must not reach into another feature's database or
private application implementation.

## Technical layer directories own Nest modules

A feature-owned `provision`, `messaging`, or `ai` directory must expose its own NestJS
module. These directories are application layers, not folders whose providers are
registered individually by the feature root module.

Use this structure:

```text
apps/server/src/<module>/
├── ai/
│   ├── mastra/
│   └── <module>-ai.module.ts
├── provision/
│   ├── <technology>-provider.ts
│   └── <module>-provision.module.ts
└── messaging/
    ├── inngest/jobs/
    └── <module>-messaging.module.ts
```

The feature root module imports these layer modules. It must not duplicate their
provider or job registrations.

Detailed agent, tool, workflow, and public AI contract rules live in
[`ai-layer-rules.md`](ai-layer-rules.md). Detailed domain-event, job, and fan-out
rules live in [`messaging-layer-rules.md`](messaging-layer-rules.md).

## Provision modules encapsulate feature adapters

The feature provision module:

- registers concrete provider implementations;
- binds module provider tokens with `useExisting` when consumers depend on a core
  interface;
- exports the token rather than the concrete implementation;
- imports shared provision capabilities only when its providers require them.

Provider files use the technology or adapter name followed by `-provider.ts`, and
classes use the corresponding `<Name>Provider` form. For example,
`docx-provider.ts` contains `DocxProvider`.

Shared capabilities used by several feature modules remain in
`apps/server/src/shared/provision`; do not recreate them in a feature provision
module.

## Messaging modules own jobs and messaging dependencies

The feature messaging module:

- registers the feature's jobs;
- imports `SharedMessagingModule` for shared brokers and Inngest infrastructure;
- imports application modules required by the jobs, such as the feature AI module;
- exports only jobs or messaging entry points consumed by application composition.

The feature root module imports the messaging module instead of registering jobs
directly. The application composition may import the feature root module or its
exported messaging module when collecting jobs for the shared Inngest endpoint.

Creating a feature messaging module must not create another Inngest controller or
endpoint. HTTP serving remains centralized in the shared messaging infrastructure.

Feature-owned provider and AI behavior is verified at its owning consuming boundary
rather than through dedicated `provision/tests/` or AI test files; those paths are
outside the repository allowlist.

Cross-feature composition belongs in the existing shared module. The shared module
may consume exported provider tokens from feature modules, but it must not import
feature-private repositories, models, or concrete adapters. Feature modules must
consume shared composition tokens rather than importing one another's database
modules to assemble cross-module behavior.

Legacy `Reader` contracts and classes are not permitted as names for application
adapters. Rename them to the capability-specific `Provider` form, including the
contract, implementation file, Nest token, injected dependency property, and
barrel export. A provider that aggregates data from multiple feature modules is
owned and registered by the existing `SharedModule`; a provider that only adapts
one feature's own persistence or a shared infrastructure capability remains in
that feature's provision layer.
