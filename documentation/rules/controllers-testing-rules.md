---
description: Integration-testing rules for NestJS controllers and database-backed routes.
---

# Controller Testing Rules

These rules apply to every HTTP controller test under `apps/server/src`, including
integration controllers outside `rest/controllers`.

## Controller tests are integration tests

Test controllers through their HTTP routes with a NestJS test application and
Supertest. The test must exercise the real path from controller to manually
instantiated use case, repository contract binding, Drizzle repository, mapper,
and database.

Do not call `controller.handle()` directly. Do not replace the repository with a
mock merely to make a controller test resemble a unit test.

## One test file per controller

Every REST controller must have its own test file under:

```text
apps/server/src/<module>/rest/controllers/tests/
```

The filename mirrors the controller and uses `.test.ts`:

```text
register-intakes.controller.test.ts
list-client-intakes.controller.test.ts
```

Do not use `.spec.ts`, combine several controllers into one test file, or leave a
controller without a corresponding integration test.

Each file tests the route owned by that controller, including the HTTP method,
path, request input, status, response body, and persisted effect when applicable.

The top-level `describe` must write the controller name with words separated and
append the HTTP method and complete route between brackets:

```ts
describe('Register Intakes Controller [POST /intakes]', () => {
  // ...
})
```

Do not use the class identifier as the description:

```ts
// Invalid
describe('RegisterIntakesController', () => {
  // ...
})
```

Path parameters must remain visible in the route, such as
`[GET /intakes/:intakeId]`.

The HTTP method and path belong only in the top-level `describe`. Individual
`it` descriptions must describe the behavior under test without repeating the
route:

```ts
describe('Get Intakes Controller [GET /intakes/:intakeId]', () => {
  it('gets an intake', async () => {
    // ...
  })
})
```

## Use real infrastructure and minimize mocks

Exercise the services used by the route through real adapters: PostgreSQL,
Supabase Auth, Supabase Storage, and Inngest must use local services or
Testcontainers. For a vendor without a local container, use a local HTTP protocol
server that implements the exercised requests and responses. A live vendor
sandbox is not required. Assert the request method, path, authorization, and
payload at that server when these are part of the integration contract.

Do not replace these adapters with no-op providers, fabricated successful
responses, or a global `fetch` mock. A narrowly controlled failure, such as a
stalled database health probe, may use a local spy when the failure cannot be
reproduced practically. Document that exception and retain real service coverage
for the successful path.

Reuse `SupabaseAuthFixture`, `LocalSupabaseStorageFixture`, and `InngestFixture`
from the shared test infrastructure. Use the configured vendor base URL to point
an adapter at its protocol server; do not add production test-mode shortcuts.

Use core entity and structure fakers to create valid domain test data. Do not
recreate domain fixtures as arbitrary inline objects in every controller test.

## DatabaseFixture encapsulates database test infrastructure

All shared PostgreSQL integration-test setup belongs in:

```text
apps/server/src/shared/database/fixtures/database-fixture.ts
```

`DatabaseFixture` is responsible for:

- starting and stopping the run-owned PostgreSQL Testcontainer;
- cloning a migrated template into a separate database for each fixture;
- setting a temporary `DATABASE_URL`;
- applying Drizzle migrations;
- exposing the database connection needed by test setup;
- truncating public application tables between tests;
- preserving the Drizzle migrations table;
- restoring environment state during teardown.

Controller tests and module-specific helpers must not duplicate container startup,
migration, cleanup, or environment restoration logic.

Reuse container processes across files through Vitest global setup rather than
restarting infrastructure and applying migrations for every file. Reuse must
preserve isolation: each database fixture gets its own database, Auth users and
Mailpit messages are cleared before each file, and test files run sequentially.
Global teardown stops run-owned services even after failures. Fixtures may use
dedicated containers when run outside this configuration. Inngest fixtures retain
their own function registrations and teardown.

`RestFixture`, under `apps/server/src/shared/rest/tests`, must compose
`DatabaseFixture` with the Nest test application. It owns generic REST integration
setup, provider resolution, database reset, and teardown.

Each module must provide its own fixture under
`apps/server/src/<module>/fixtures`. For Intake, this is
`IntakeModuleFixture`. A module fixture composes `RestFixture` and may only own
feature-specific module setup, repository access, seed data, and domain helpers.
Do not create function-based test contexts or duplicate generic REST and database
lifecycle code.

Every fixture must expose a static `register` method as its entry point. Do not
use a static `create` method for fixture initialization.

## Build the test application with real module wiring

The Nest testing module must include the target controller and the actual feature
database and provision modules required by it. Repository tokens must resolve to
the same concrete providers used by the application.

Use the real authentication and access guards. Create a real Auth user and bearer
token, then seed the associated local user and collaborator with the status and
profile required by the route. Admin routes must use an admin collaborator;
portal routes must validate a stored hashed portal token and its permissions.
Do not override guards or inject an authorized collaborator or portal grant to
make an integration test pass.

Prefer the actual feature module when testing its composition. If a fixture
imports individual layers for isolation, verify that production also registers
the controller and its dependencies; a hand-picked test provider list cannot
prove production wiring.

Seed prerequisites through the module seeder or the real repository. Prefer the
module seeder and `addMany` when a scenario needs several records. Do not insert
raw SQL rows that bypass module models and mappers unless the test explicitly
verifies corrupted or legacy persistence data.

## Isolate every test

Clean application tables before every test. Create only the records required by
the current scenario.

Close the Nest application and release the database fixture after all tests,
even when an assertion fails. Do not allow ports, connections, containers, or
environment variables to leak into another test file.

Teardown must also tolerate partial fixture initialization. Release resources
already started when a later startup step fails, and guard cleanup of fixtures
that were never assigned. Stop test-owned services; leave shared Compose
services running.

Tests that share one fixture must still be order-independent.

## Assert the HTTP and persistence contracts

For write controllers, assert the response and verify the resulting record through
the real repository or a subsequent HTTP read when appropriate.

For read controllers, seed distinguishable records and assert filtering, ordering,
optional values, and response serialization that are part of the endpoint
contract.

Include error-path assertions when the controller, NestJS integration, or use case
maps a domain error into a defined HTTP response.

For routes that publish events, also apply
[`messaging-layer-rules.md`](messaging-layer-rules.md): import the domain event's
`_NAME`, publish through the real broker, and state whether the test verifies
publication or downstream job execution.

## Audit coverage by controller location

Inventory controllers across `apps/server/src`, including shared integration
directories, and compare each controller with its own HTTP test. A matching test
filename measures test-file completeness; it does not prove behavioral coverage
or 100% source coverage.

As of 2026-10-03, the 99 controllers under `**/rest/controllers` have matching
`.controller.test.ts` files. The separate
`src/shared/communication/whatsapp-webhook.controller.spec.ts` remains legacy
direct-call, mocked coverage. It must not be reported as real HTTP or Inngest
integration evidence, and must be migrated to the standard when its controller
tests are next changed.

## Test files do not ship in production builds

Server build configuration must exclude `**/tests/**` and `**/*.test.ts`.
Integration tests rely on the Vitest alias configuration so internal imports keep
the same `@/` paths used by production server code.

Running controller integration tests requires a working Docker-compatible
container runtime.
