---
description: Domain-event, broker, Inngest job, fan-out, and NestJS messaging composition rules.
---

# Messaging Layer Rules

These rules apply to shared messaging infrastructure, module-owned messaging
adapters, domain events consumed asynchronously, and application composition of
Inngest functions.

## Core owns domain events and the broker contract

Domain events belong to the module that defines their meaning under:

```text
packages/core/src/<module>/domain/events/
```

Each event is a class that extends the shared `Event`, declares a static `_NAME`,
and types its complete payload. Event names must describe the domain occurrence;
do not expose an implementation detail such as the AI provider in the name.

```ts
export class DocumentGenerationRequestedEvent extends Event<Payload> {
  static readonly _NAME = 'document-production/document.generation-requested'
}
```

Publishers and consumers import `_NAME`; they must not repeat the event-name
literal. When a job creates a child event, instantiate the domain event and send
its `name` and `payload` instead of recreating an untyped object.

The shared broker contract remains deliberately small:

```ts
export interface Broker {
  publish(event: Event): Promise<void>
}
```

Core use cases depend on `Broker`, never on `InngestClient`. `InngestBroker` is
the shared server implementation.

## The originating module builds authoritative event data

A module that requests asynchronous work must load and authorize its own data
before publishing the event. Consumers must not reach into repositories owned by
the originating module merely to reconstruct the request.

For document generation, Consulta, Formalização, or Caso builds the complete
`DocumentGenerationSource` snapshot before publishing. The snapshot contains a
discriminated `type`, the owning entity reference, and its unstructured `data`.
Document Production may persist that snapshot for traceability, but it must not
replace it by reading repositories from those modules.

Do not accept an authoritative source snapshot assembled by the browser. A
controller receives references and action options; its module use case validates
permission, loads domain data, builds the snapshot, and then publishes.

## Shared messaging owns the Inngest infrastructure

Shared infrastructure belongs under:

```text
apps/server/src/shared/messaging/
├── inngest/
│   ├── inngest-broker.ts
│   ├── inngest-client.ts
│   ├── inngest-job.ts
│   ├── inngest-options.ts
│   └── inngest.module.ts
└── shared-messaging.module.ts
```

There is exactly one Inngest HTTP endpoint, served by the controller under the
shared REST layer. A feature must not create its own Inngest controller or reuse
another feature's controller. Adding a job must not alter the behavior or route
of existing jobs such as WhatsApp processing.

The application composition registers every exported job function in the single
Inngest endpoint. A feature messaging module owns and exports its jobs; the
feature root module imports that messaging module.

## Jobs expose a stable ID and `this.function`

Every Inngest job is an injectable class that extends `InngestJob` and assigns a
stable function identifier and a typed function in its constructor:

```ts
@Injectable()
export class ExampleJob extends InngestJob {
  static readonly ID = 'module/example'

  readonly function: InngestFunction.Like

  constructor(inngest: InngestClient, dependency: Dependency) {
    super(inngest)
    this.function = this.inngest.createFunction(
      { id: ExampleJob.ID },
      /* trigger and handler */,
    )
  }
}
```

Use `ExampleJob.ID` everywhere the function must be identified, including
application registration and test fixtures. Do not repeat the function ID
literal outside the job class.

Do not put a generic `handle(context)` method in the base class and do not pass a
handler through `super`. Those shapes erase the event-specific inference that
`createFunction` provides. Dependencies, including repository tokens or core
interfaces, may be injected normally through NestJS.

Jobs coordinate durable execution and translation between events. Business
decisions belong to core use cases. A job may invoke a workflow or use case, but
must not reproduce its rules inline.

Translate known deterministic `AppError` business failures into Inngest
`NonRetriableError` at the job boundary. Such failures cannot succeed until a new
event or domain-state change occurs. Leave unexpected infrastructure failures
retriable so Inngest can apply the function's retry policy.

## Event schemas validate transport payloads

An Inngest trigger uses `eventType` with the domain event's `_NAME` and a Zod
schema for its serialized payload. Dates cross the transport boundary as ISO
date-time strings and are converted back to `Date` only when constructing a
domain event or domain input that requires it.

The transport schema and domain payload must describe the same fields. A job
must forward the full validated input required by the next workflow rather than
silently loading an alternative payload from unrelated modules.

## Fan-out publishes individual domain events

Batch work uses a dedicated batch domain event and a dedicated fan-out job. The
fan-out job publishes one existing individual event per item with
`step.sendEvent`; it does not call another job's function directly and does not
use `step.invoke`.

```text
DocumentBatchGenerationRequestedEvent
  -> GenerateDocumentsInBatchJob
      -> DocumentGenerationRequestedEvent (one per document)
          -> GenerateDocumentJob
```

Use the array form of `step.sendEvent` so the fan-out is a durable, memoized
Inngest step. Each child event must remain independently retryable and
reprocessable. Success or failure of one child must not erase successful sibling
work.

## Direct publication is the MVP reliability boundary

The MVP publishes through `Broker` without a transactional outbox. Do not add an
event table, polling relay, or outbox framework unless a requirement explicitly
changes the delivery guarantee. Revisit an outbox when database mutation and
event publication must become atomic or when observed event loss justifies the
additional operational complexity.

A durable domain work ledger may be reconciled periodically when a user-visible
asynchronous state would otherwise remain stranded after direct publication fails.
This is not a generic outbox: the owning module persists the work lifecycle required
by its domain, publishes the normal batch event after commit, and lets a bounded
reconciler republish only unfinished or lease-expired work. The exception must be
approved in Architecture and the feature Spec, must keep payloads minimized, and
must not introduce a shared event table or relay arbitrary events.

## Test jobs through the integration boundary

Job tests must exercise the real Inngest Dev Server and the owning Nest module,
including applicable database and external-service effects. Do not call a job
handler or durable step directly and do not treat mocked use-case execution as
job integration evidence.

Follow [`jobs-testing-rules.md`](jobs-testing-rules.md) for test location, module
fixture composition, canonical event construction, Testcontainers services,
business-rule scenarios, isolation, execution APIs, and CI requirements.

## Antipatterns to Avoid

- **Using a work reconciler as an implicit outbox:** do not persist arbitrary event
  envelopes or relay unrelated events. Persist the domain work state, publish the
  canonical batch event directly after commit, and prove bounded reconciliation of
  only pending or lease-expired work.
- **Retrying leased work without an attempt identity:** do not finalize asynchronous
  work by state alone. Scheduling creates an attempt token, a claim activates its lease,
  and completion, terminal failure and cleanup use compare-and-set with that token so an
  expired worker cannot overwrite a newer attempt.
