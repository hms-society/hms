---
description: Implementation plan for the client register dialog HMS specification.
spec: documentation/features/identity/client-registration/specs/client-register-dialog-spec.md
jira_tickets: []
status: open
---

## Open questions

- [ ] **Q1 — Consent wording:** HMS Legal must approve the final localized copy for
  `data_processing`, `whatsapp_communication`, `email_communication`, and
  `third_party_sharing`. Until approval, T5.7 may use clearly identified provisional
  development copy from Pencil frame `CmxME`, but the flow must not be released to
  production.
- [ ] **Q2 — Seventh Pencil node:** the request cited seven node IDs but supplied six.
  Product/design must confirm whether a seventh state exists; if it adds a state or rule,
  revise F5 before implementation. The six specified states remain implementable.
- [ ] **Q3 — Runnable Web consumer:** no route or component currently renders
  `ClientRegisterDialog`. Product must designate a real consumer and its trigger/callback
  behavior without adding Intake creation or linking. This blocks T6.2 because Playwright
  MCP validation cannot use a synthetic page or validate focus restoration without the
  actual integration point.
- [x] **Q4 — Concurrent Client insertion contract:** the database already prevents
  duplicate tax IDs, but `ClientsRepository.add` currently returns only `Client` and
  `DrizzleClientsRepository.add` leaks a unique-constraint failure. Architecture must
  confirm the database-agnostic collision result (for example, an explicit no-insert
  result) that T1.3 and T3.1 will translate to `ClientAlreadyExistsError`. Without this
  decision, concurrent `POST /clients` cannot reliably produce the required `409`.
  **Decision:** `add` returns `undefined` when the atomic insert loses the tax-ID
  uniqueness race; Core translates that result to `ClientAlreadyExistsError`.

## Phase dependencies

| Phase | Objective | Depends on | Parallel with |
|---|---|---|---|
| F1 | Correct Identity domain contracts and use cases | - | - |
| F2 | Centralize Identity request/form validation | F1 | - |
| F3 | Implement concurrency-safe persistence and REST routes | F1, F2 | F4 |
| F4 | Expose and compose the Identity REST service in Web | F1, F2 | F3 |
| F5 | Implement the controlled multi-step dialog | F2, F4 | F3 |
| F6 | Execute cross-workspace and real-browser validation | F3, F5 | - |

## F1 — Core: Identity contracts and use cases

### Tasks

- [x] **T1.1** — Extend the consent persistence contract in
  `packages/core/src/identity/interfaces/client-consents-repository.ts` with active
  lookup by Client/type and an atomic single-grant operation whose result represents a
  collision without exposing Drizzle; retain `addMany` for seeding.
  - **Depends on:** -
  - **Observable result:** Core can distinguish an inserted consent from a concurrent
    active-consent collision and can query one active type without loading unrelated
    grants.
  - **Layer:** `core`
  - **Workspace:** `@hms/core`
  - **Validation:** `pnpm --filter @hms/core lint` and
    `pnpm --filter @hms/core check-types` accept all contract consumers after F3.

- [x] **T1.2** — Extend
  `packages/core/src/identity/interfaces/identity-service.ts` with
  `grantClientConsent(clientId, type)` returning
  `RestResponse<ClientConsent>`.
  - **Depends on:** T1.1
  - **Observable result:** Web has one shared, typed service operation for granting
    exactly one consent to an existing Client.
  - **Layer:** `core`
  - **Workspace:** `@hms/core`
  - **Validation:** `pnpm --filter @hms/core lint` and
    `pnpm --filter @hms/core check-types` verify the public contract and exports.

- [x] **T1.3** — Correct
  `packages/core/src/identity/use-cases/register-client-use-case.ts` so
  `RegisterClientRequest` has no `consents`, CPF/CNPJ values are normalized and checked
  for length, repeated digits, and check digits, type-specific names are enforced, and
  only the Client is persisted; incorporate the Q4 collision contract once resolved.
  - **Depends on:** Q4
  - **Observable result:** natural and legal registrations return
    `{ client, consents: [] }`; invalid identifiers and incompatible required data fail
    before persistence; sequential and concurrent duplicate tax IDs produce
    `ClientAlreadyExistsError`; no consent or business timestamp dependency remains.
  - **Layer:** `core`
  - **Workspace:** `@hms/core`
  - **Validation:** `pnpm --filter @hms/core lint` and
    `pnpm --filter @hms/core check-types` verify the corrected request and constructor.

- [x] **T1.3t** — Update
  `packages/core/src/identity/use-cases/tests/register-client-use-case.test.ts` for the
  corrected registration behavior.
  - **Depends on:** T1.3
  - **Observable result:** Vitest covers valid normalized CPF and CNPJ registrations,
    missing natural/legal names, wrong identifier kind, invalid/repeated/check-digit
    values, no partial persistence, an empty consent list, pre-existing duplicates, and
    the Q4 concurrent collision result without calling a consent repository or clock.
  - **Layer:** `test`
  - **Workspace:** `@hms/core`
  - **Validation:** `pnpm --filter @hms/core test` passes with typed repository mocks.

- [x] **T1.4** — Apply the same normalized CPF/CNPJ validity rules to
  `packages/core/src/identity/use-cases/lookup-client-use-case.ts`, preserving tax-ID
  priority over phone and phone-only ambiguity behavior.
  - **Depends on:** T1.3
  - **Observable result:** masked valid identifiers reach `findByTaxId` as digits with
    the correct kind; invalid tax IDs fail before repository access; when both criteria
    exist, phone is not used as a combined lookup.
  - **Layer:** `core`
  - **Workspace:** `@hms/core`
  - **Validation:** `pnpm --filter @hms/core lint` and
    `pnpm --filter @hms/core check-types` pass.

- [x] **T1.4t** — Update
  `packages/core/src/identity/use-cases/tests/lookup-client-use-case.test.ts` with valid
  fixtures and the strengthened lookup cases.
  - **Depends on:** T1.4
  - **Observable result:** Vitest covers CPF/CNPJ normalization and check digits,
    repeated/invalid identifiers, empty criteria, tax-ID priority, unique phone match,
    ambiguous phone conflict, not found, and returned active consents.
  - **Layer:** `test`
  - **Workspace:** `@hms/core`
  - **Validation:** `pnpm --filter @hms/core test` passes.

- [x] **T1.5** — Create
  `packages/core/src/identity/use-cases/grant-client-consent-use-case.ts` and export it
  from `packages/core/src/identity/use-cases/index.ts`.
  - **Depends on:** T1.1
  - **Observable result:** the use case accepts one `{ clientId, type }`, rejects a
    missing Client, rejects an already active grant, timestamps through
    `DatetimeProvider`, inserts one grant, converts an atomic collision into
    `ClientConsentAlreadyGrantedError`, and returns the created `ClientConsent`.
  - **Layer:** `core`
  - **Workspace:** `@hms/core`
  - **Validation:** `pnpm --filter @hms/core lint` and
    `pnpm --filter @hms/core check-types` pass.

- [x] **T1.5t** — Create
  `packages/core/src/identity/use-cases/tests/grant-client-consent-use-case.test.ts`.
  - **Depends on:** T1.5
  - **Observable result:** Vitest covers success, the exact deterministic provider time,
    missing Client, a pre-existing active type, concurrent insertion collision, one
    repository insertion only, and propagation of the created domain value.
  - **Layer:** `test`
  - **Workspace:** `@hms/core`
  - **Validation:** `pnpm --filter @hms/core test` passes with
    `vitest-mock-extended` contracts and no infrastructure.

## F2 — Validation: shared Identity schemas

### Tasks

- [x] **T2.1** — Strengthen
  `packages/validation/src/identity/schemas/lookup-client-schema.ts` to require at least
  one criterion, normalize masked CPF/CNPJ and phone values, and emit form-safe errors
  for invalid lengths, repeated digits, and check digits.
  - **Depends on:** T1.4
  - **Observable result:** Server and Web parse the same lookup input to digits-only
    values, while a valid tax ID can deterministically take precedence when both fields
    are present.
  - **Layer:** `core`
  - **Workspace:** `@hms/validation`
  - **Validation:** `pnpm --filter @hms/validation lint` and
    `pnpm --filter @hms/validation check-types` pass.

- [x] **T2.2** — Rebuild
  `packages/validation/src/identity/schemas/register-client-schema.ts` by composing the
  existing Client type and address schemas, and adjust
  `packages/validation/src/identity/schemas/address-schema.ts` only as needed for the
  all-or-none address rule.
  - **Depends on:** T1.3
  - **Observable result:** the schema discriminates `natural`/`legal`, requires the
    correct name and CPF/CNPJ, excludes incompatible names, accepts optional contact
    data, requires every non-complement address field together, models all four consent
    booleans for the form draft, and maps the validated registration request without a
    `consents` array.
  - **Layer:** `core`
  - **Workspace:** `@hms/validation`
  - **Validation:** `pnpm --filter @hms/validation lint` and
    `pnpm --filter @hms/validation check-types` pass; inferred `z.infer` types support
    both React Hook Form and the Server request boundary without manual duplicates.

- [x] **T2.3** — Create
  `packages/validation/src/identity/schemas/grant-client-consent-schema.ts` and export
  it through `packages/validation/src/identity/schemas/index.ts` and
  `packages/validation/src/identity/index.ts`.
  - **Depends on:** T1.2
  - **Observable result:** parsing accepts an object containing exactly one valid
    `ConsentType` and rejects missing, unknown, array-valued, or extra request fields.
  - **Layer:** `core`
  - **Workspace:** `@hms/validation`
  - **Validation:** `pnpm --filter @hms/validation lint` and
    `pnpm --filter @hms/validation check-types` pass.

- [x] **T2.3t** — Add the approved Vitest test command/dev dependency to
  `packages/validation/package.json`, update `pnpm-lock.yaml`, and create focused
  Identity schema tests under `packages/validation/src/identity/schemas/tests/`.
  - **Depends on:** T2.1, T2.2, T2.3
  - **Observable result:** automated tests cover valid/masked and invalid lookup input;
    natural/legal registration, incompatible fields, optional contacts, partial/full
    address, invalid email and tax IDs, rejection of the obsolete registration
    `consents` payload; and exact single-type consent grants. No competing validation
    library is introduced.
  - **Layer:** `test`
  - **Workspace:** `@hms/validation`
  - **Validation:** `pnpm --filter @hms/validation test`,
    `pnpm --filter @hms/validation lint`, and
    `pnpm --filter @hms/validation check-types` pass.

## F3 — Server: persistence and REST

### Tasks

- [x] **T3.1** — Implement atomic grant persistence in
  `apps/server/src/identity/database/drizzle/repositories/drizzle-client-consents-repository.ts`
  with active Client/type lookup and `onConflictDoNothing`; implement the Q4
  database-agnostic Client collision result in
  `apps/server/src/identity/database/drizzle/repositories/drizzle-clients-repository.ts`
  without changing models or generating a migration.
  - **Depends on:** T1.1, Q4
  - **Observable result:** one active consent per Client/type and one Client per tax ID
    remain safe under races; repositories return contract-level collision results and
    never leak PostgreSQL/Drizzle errors to Core.
  - **Layer:** `database`
  - **Workspace:** `server`
  - **Validation:** behavior is exercised through T3.2t and T3.4t; additionally,
    `pnpm --filter server lint` and `pnpm --filter server check-types` pass and no
    migration files change.

- [x] **T3.2** — Simplify
  `apps/server/src/identity/rest/controllers/register-client.controller.ts` to inject
  only `ClientsRepository` and instantiate the corrected `RegisterClientUseCase`.
  - **Depends on:** T1.3, T2.2, T3.1
  - **Observable result:** `POST /clients` accepts no consents, returns `201` with
    `ClientDetails.consents: []`, returns `400` for invalid data, and maps duplicate tax
    IDs—including the resolved concurrent collision—to `409`.
  - **Layer:** `rest`
  - **Workspace:** `server`
  - **Validation:** `pnpm --filter server lint` and
    `pnpm --filter server check-types` pass.

- [x] **T3.2t** — Update
  `apps/server/src/identity/rest/controllers/tests/register-client.controller.test.ts`
  and only the necessary helpers in
  `apps/server/src/identity/fixtures/identity-module-fixture.ts`.
  - **Depends on:** T3.2
  - **Observable result:** Supertest/Drizzle covers valid natural and legal requests,
    normalization, no consent rows, invalid check digits and partial addresses with no
    persisted Client, obsolete `consents` rejection, sequential duplicate conflict,
    concurrent duplicate requests with one persisted Client, and stable error payloads.
  - **Layer:** `test`
  - **Workspace:** `server`
  - **Validation:** `pnpm --filter server test` passes with the real database fixture.

- [x] **T3.2v** — Smoke-validate the changed registration route with `curl` against the
  running local Server and database (`docker compose up`, then
  `pnpm --filter server dev`).
  - **Depends on:** T3.2t
  - **Observable result:** recorded sanitized commands show `201` and the expected
    Client shape with `consents: []` for a valid request, `400` for an invalid CPF or
    partial address, and `409` for a repeated valid tax ID; a follow-up
    `GET /clients/:clientId` confirms one persisted Client and no consent rows.
  - **Layer:** `test`
  - **Workspace:** `server`
  - **Validation:** use the real `POST /clients` method/path, `Content-Type` header, and
    representative JSON without secrets or real personal data; record observed status
    codes and response shapes.

- [x] **T3.3t** — Expand
  `apps/server/src/identity/rest/controllers/tests/lookup-client.controller.test.ts` for
  the strengthened schema and use case.
  - **Depends on:** T1.4t, T2.1, T3.1
  - **Observable result:** Supertest/Drizzle covers `200` by normalized tax ID, tax-ID
    priority when phone is also present, `200` by a unique phone, `400` for missing or
    invalid criteria, `404` for no match, and `409` for an ambiguous phone, with no PII
    in technical errors.
  - **Layer:** `test`
  - **Workspace:** `server`
  - **Validation:** `pnpm --filter server test` passes.

- [x] **T3.3v** — Smoke-validate `POST /clients/lookup` with `curl` against the running
  local Server/database.
  - **Depends on:** T3.3t
  - **Observable result:** recorded sanitized calls demonstrate `200` for an existing
    normalized tax ID, `404` for a valid absent identifier, `400` for invalid/empty
    criteria, and `409` for an ambiguous phone seeded through representative test data;
    response and error shapes match the REST contract.
  - **Layer:** `test`
  - **Workspace:** `server`
  - **Validation:** start/reuse services with `docker compose up` and
    `pnpm --filter server dev`, inspect the real HTTP responses, and expose no secrets or
    real personal data.

- [x] **T3.4** — Create
  `apps/server/src/identity/rest/controllers/grant-client-consent.controller.ts` using
  `grantClientConsentSchema`, route `clientId`, repository tokens, and the shared
  `DatetimeProvider` to expose `POST /clients/:clientId/consents`.
  - **Depends on:** T1.5, T2.3, T3.1
  - **Observable result:** the controller accepts exactly one consent type, instantiates
    its use case once, returns `201` with `ClientConsent`, returns `404` for a missing
    Client, `409` for an active/concurrent duplicate, and `400` for invalid bodies.
  - **Layer:** `rest`
  - **Workspace:** `server`
  - **Validation:** `pnpm --filter server lint` and
    `pnpm --filter server check-types` pass.

- [x] **T3.4t** — Create
  `apps/server/src/identity/rest/controllers/tests/grant-client-consent.controller.test.ts`
  and extend `IdentityModuleFixture` only with the Client/consent observations required
  by the integration test.
  - **Depends on:** T3.4
  - **Observable result:** Supertest/Drizzle covers a successful persisted grant,
    deterministic response shape, missing Client, invalid/extra body fields, repeated
    active type, concurrent same-type requests with one row, and independent grants for
    different types.
  - **Layer:** `test`
  - **Workspace:** `server`
  - **Validation:** `pnpm --filter server test` passes with one isolated database
    lifecycle owned by `RestFixture`.

- [x] **T3.5** — Export/register the grant controller through
  `apps/server/src/identity/rest/controllers/index.ts` and
  `apps/server/src/identity/identity.module.ts`.
  - **Depends on:** T3.4
  - **Observable result:** the production `IdentityModule` resolves repository/provider
    dependencies and serves `POST /clients/:clientId/consents`.
  - **Layer:** `rest`
  - **Workspace:** `server`
  - **Validation:** `pnpm --filter server lint`,
    `pnpm --filter server check-types`, and `pnpm --filter server test` pass.

- [x] **T3.4v** — Smoke-validate the new consent route with `curl` against the running
  local Server/database.
  - **Depends on:** T3.4t, T3.5
  - **Observable result:** after creating a Client, a real
    `POST /clients/:clientId/consents` returns `201`; a follow-up
    `GET /clients/:clientId` contains exactly that active type; invalid input returns
    `400`, a missing Client returns `404`, and a repeated grant returns `409` without a
    second row.
  - **Layer:** `test`
  - **Workspace:** `server`
  - **Validation:** start/reuse `docker compose up` and
    `pnpm --filter server dev`, record sanitized commands/status/payload observations,
    and use no secrets or real personal data.

- [x] **T3.6** — Synchronize
  `apps/server/rest-client/identity/clients.rest` with all Client routes, remove
  registration `consents`, use valid representative CPF/CNPJ data, and add the
  single-consent grant request.
  - **Depends on:** T3.2, T3.4
  - **Observable result:** the REST client file documents lookup, registration, get by
    ID, and one-type consent grant with the real methods, paths, and payloads.
  - **Layer:** `rest`
  - **Workspace:** `server`
  - **Validation:** compare every example with the registered controllers and run
    `pnpm --filter server lint` and `pnpm --filter server check-types`.

## F4 — Web: REST adapter and application composition

### Tasks

- [x] **T4.1** — Add `grantClientConsent` to
  `apps/web/src/rest/services/identity-service.ts`, mapped directly to
  `POST /clients/:clientId/consents` through the existing `RestClient`.
  - **Depends on:** T1.2, T2.3
  - **Observable result:** `IdentityService` implements the complete Core contract and
    delegates get, lookup, registration, and single-consent grant without UI or domain
    decisions.
  - **Layer:** `rest`
  - **Workspace:** `web`
  - **Validation:** `pnpm --filter web lint` and
    `pnpm --filter web check-types` pass.

- [x] **T4.1t** — Add a focused adapter test under
  `apps/web/src/rest/services/tests/identity-service.test.ts` using a typed mocked
  `RestClient`.
  - **Depends on:** T4.1
  - **Observable result:** Vitest proves the exact HTTP method/path/body for lookup,
    register without consents, get by ID, and one-type consent grant, while preserving
    typed `RestResponse` values.
  - **Layer:** `test`
  - **Workspace:** `web`
  - **Validation:** `pnpm --filter web test` passes.

- [x] **T4.2** — Compose Identity REST access by updating
  `apps/web/src/ui/shared/contexts/rest-context/types/rest-context-value.ts`,
  `apps/web/src/ui/shared/contexts/rest-context/use-rest-context-provider.ts`, and
  `apps/web/src/ui/shared/contexts/rest-context/index.tsx`, then mount
  `RestContextProvider` in
  `apps/web/src/ui/shared/widgets/layouts/root-layout/index.tsx` inside
  `QueryClientProvider` and above all consumers.
  - **Depends on:** T4.1
  - **Observable result:** the context starts at `null`, exposes
    `ReturnType<typeof IdentityService>` alongside Intake, the consumer hook fails with
    `AppError` outside the provider, and every application route can resolve the service.
  - **Layer:** `ui`
  - **Workspace:** `web`
  - **Validation:** `pnpm --filter web lint` and
    `pnpm --filter web check-types` pass without changing generated routes.

- [x] **T4.2t** — Add context/composition coverage in
  `apps/web/src/ui/shared/contexts/rest-context/tests/rest-context.test.tsx` and
  `apps/web/src/ui/shared/widgets/layouts/root-layout/tests/root-layout.test.tsx` for
  `RestContextProvider`, `useRestContext`, and `RootLayout`.
  - **Depends on:** T4.2
  - **Observable result:** Testing Library/Vitest covers the missing-provider error, an
    available Identity service inside the provider, preservation of Intake service, and
    RootLayout provider placement without making real Axios calls.
  - **Layer:** `test`
  - **Workspace:** `web`
  - **Validation:** `pnpm --filter web test` passes.

## F5 — Web: controlled Client registration dialog

### Tasks

- [x] **T5.1** — Register only the icons required by the six dialog states in
  `apps/web/src/ui/shared/widgets/components/icon/types/icon-name.ts` and
  `apps/web/src/ui/shared/widgets/components/icon/lucide-icon/icons.ts`.
  - **Depends on:** -
  - **Observable result:** every dialog state uses the HMS `Icon` boundary with typed,
    kebab-case names and no direct Lucide imports.
  - **Layer:** `ui`
  - **Workspace:** `web`
  - **Validation:** covered through T5.9t; `pnpm --filter web lint` and
    `pnpm --filter web check-types` pass.

- [x] **T5.2** — Create
  `apps/web/src/ui/shared/widgets/components/client-register-dialog/use-client-register-dialog.ts`
  to own the six-state presentation flow, separate Identification and shared
  Registration React Hook Form instances, schema resolvers, draft lifecycle, created
  Client identity, confirmed/pending grants, request locks, error mapping, and public
  callbacks without rendering markup.
  - **Depends on:** T2.1, T2.2, T4.2
  - **Observable result:** every opening resets to Identification; early close discards
    only local data; lookup maps `200`/`404`/other errors to the specified states; step
    transitions validate owned fields; type changes confirm destructive clearing;
    registration never sends consents; `409` registration re-lookups by tax ID; grants
    run once per selected type; partial grant failure retains `clientId` and retries only
    pending types; grant `409` is reconciled through Client reload; same-action concurrent
    submissions are blocked; success emits final `ClientDetails` and closes.
  - **Layer:** `ui`
  - **Workspace:** `web`
  - **Validation:** `pnpm --filter web lint` and
    `pnpm --filter web check-types` prove `z.infer` form values and context contracts;
    no PII is logged.

- [x] **T5.2t** — Create
  `apps/web/src/ui/shared/widgets/components/client-register-dialog/tests/use-client-register-dialog.test.ts`.
  - **Depends on:** T5.2
  - **Observable result:** `renderHook` tests reset/preservation transitions, schema-backed
    step blocking, tax-ID priority, successful existing selection, registration without
    consents, no-consent completion, sequential independent grants, durable created
    Client after partial failure, retry of pending types only, both `409` reconciliation
    paths, same-action locking, final `ClientDetails`, and absence of PII logging by
    mocking the context contract rather than Axios.
  - **Layer:** `test`
  - **Workspace:** `web`
  - **Validation:** `pnpm --filter web test` passes.

- [x] **T5.3** — Create
  `apps/web/src/ui/shared/widgets/components/client-register-dialog/client-register-dialog-stepper.tsx`
  for the five visual steps.
  - **Depends on:** T5.1
  - **Observable result:** current and completed steps are communicated by text/icon and
    `aria-current`, with Existing Client and Client Not Found represented as Search
    states and never by color alone.
  - **Layer:** `ui`
  - **Workspace:** `web`
  - **Validation:** covered through T5.9t; `pnpm --filter web lint` and
    `pnpm --filter web check-types` pass.

- [x] **T5.4** — Create
  `apps/web/src/ui/shared/widgets/components/client-register-dialog/client-identification-step.tsx`
  for masked criteria, accessible schema errors, clear/search actions, live loading, and
  actionable asynchronous failures.
  - **Depends on:** T5.2
  - **Observable result:** labels and `FieldError` associations are persistent, invalid
    input prevents REST calls, clear resets only lookup criteria, loading is announced
    and unavailable, and non-404 failures preserve input without internal details.
  - **Layer:** `ui`
  - **Workspace:** `web`
  - **Validation:** covered through T5.9t; `pnpm --filter web lint` and
    `pnpm --filter web check-types` pass.

- [x] **T5.5** — Create
  `apps/web/src/ui/shared/widgets/components/client-register-dialog/client-search-result-step.tsx`
  with a discriminated existing/not-found presentation.
  - **Depends on:** T5.2, T5.3
  - **Observable result:** existing Client shows only necessary masked identity and all
    four consent states, selection emits the result, alternate search resets state; not
    found repeats masked criteria, Back preserves them, and Continue initializes the
    registration draft.
  - **Layer:** `ui`
  - **Workspace:** `web`
  - **Validation:** covered through T5.9t; `pnpm --filter web lint` and
    `pnpm --filter web check-types` pass.

- [x] **T5.6** — Create
  `apps/web/src/ui/shared/widgets/components/client-register-dialog/client-registration-step.tsx`
  for natural/legal identity, optional contact data, and the optional complete address.
  - **Depends on:** T5.2
  - **Observable result:** an 11/14-digit lookup preselects the correct type; only
    compatible names render and enter the request; changing populated type requires
    confirmation; every field is RHF-controlled/registered; Back preserves the draft;
    Continue cannot advance past invalid required, tax-ID, email, or partial-address
    data.
  - **Layer:** `ui`
  - **Workspace:** `web`
  - **Validation:** covered through T5.9t; `pnpm --filter web lint` and
    `pnpm --filter web check-types` pass.

- [x] **T5.7** — Create
  `apps/web/src/ui/shared/widgets/components/client-register-dialog/client-privacy-step.tsx`
  with four independent unchecked consent controls and Q1-governed copy.
  - **Depends on:** T5.2, Q1 for production copy
  - **Observable result:** every checkbox has a persistent label/description, contact
    fields never auto-select consent, no option blocks creation, absence reads as the
    localized `Not registered` rather than `Revoked`, and Back/Continue use the shared
    registration form.
  - **Layer:** `ui`
  - **Workspace:** `web`
  - **Validation:** covered through T5.9t; `pnpm --filter web lint` and
    `pnpm --filter web check-types` pass.

- [x] **T5.8** — Create
  `apps/web/src/ui/shared/widgets/components/client-register-dialog/client-review-step.tsx`
  for identity, contact/address, privacy, edit actions, submission progress, and pending
  consent retry state without direct REST calls.
  - **Depends on:** T5.2, T5.7
  - **Observable result:** summaries use localized `Not provided`/`Not registered`, Edit
    preserves the draft, copy promises only Client creation, final completion uses the
    form's `handleSubmit`, partial consent failure explains that the Client exists and
    lists only pending types, and retry remains available without repeating registration.
  - **Layer:** `ui`
  - **Workspace:** `web`
  - **Validation:** covered through T5.9t; `pnpm --filter web lint` and
    `pnpm --filter web check-types` pass.

- [x] **T5.9** — Implement the controlled public boundary in
  `apps/web/src/ui/shared/widgets/components/client-register-dialog/index.tsx`, composing
  the hook, stepper, and six states with the specified props and no trigger, navigation,
  or Intake knowledge.
  - **Depends on:** T5.2, T5.3, T5.4, T5.5, T5.6, T5.7, T5.8
  - **Observable result:** `open`, `onOpenChange`, and `onClientSelected` are the only
    public flow controls; title/description are semantically associated; opening focuses
    the first field; step transitions focus the heading; closing restores prior trigger
    focus; header/actions remain accessible while content scrolls; narrow viewports
    reflow to one column without horizontal scrolling; semantic tokens, `font-serif` and
    `font-sans`, light/dark themes, visible focus, and reduced motion are respected.
  - **Layer:** `ui`
  - **Workspace:** `web`
  - **Validation:** `pnpm --filter web lint` and
    `pnpm --filter web check-types` pass; neither `routeTree.gen.ts` nor `design/hms.pen`
    changes.

- [x] **T5.9t** — Create
  `apps/web/src/ui/shared/widgets/components/client-register-dialog/tests/client-register-dialog.test.tsx`
  at the public widget boundary.
  - **Depends on:** T5.2t, T5.9
  - **Observable result:** Testing Library covers the six states and complete primary
    flow, controlled open/close callbacks, fresh reopening, masked PII, all consent
    summaries, missing-value copy, client-side errors with `aria-invalid`/associated
    messages and no REST request, loading/live announcements, focus on open/transitions
    and restoration on close, keyboard operation, destructive type-change confirmation,
    existing Client selection, registration conflict recovery, consent retry without a
    second `POST /clients`, responsive semantics, and final callback payload.
  - **Layer:** `test`
  - **Workspace:** `web`
  - **Validation:** `pnpm --filter web test` passes using real internal steps and mocked
    HMS context services, not mocked child widgets or Axios.

## F6 — Integrated validation and handoff

### Tasks

- [x] **T6.1** — Run the complete affected-workspace automated quality gate after all
  implementation and targeted tests.
  - **Depends on:** T2.3t, T3.2v, T3.3v, T3.4v, T4.2t, T5.9t
  - **Observable result:** all schema, Core, Server integration, Web hook/widget, lint,
    and type checks pass together; failures are corrected in their owning task rather
    than waived.
  - **Layer:** `test`
  - **Workspace:** `@hms/validation`, `@hms/core`, `server`, `web`
  - **Validation:** run
    `pnpm --filter @hms/validation lint`,
    `pnpm --filter @hms/validation check-types`,
    `pnpm --filter @hms/validation test`,
    `pnpm --filter @hms/core lint`,
    `pnpm --filter @hms/core check-types`,
    `pnpm --filter @hms/core test`,
    `pnpm --filter server lint`,
    `pnpm --filter server check-types`,
    `pnpm --filter server test`,
    `pnpm --filter web lint`,
    `pnpm --filter web check-types`, and
    `pnpm --filter web test`.
  - **Result:** all listed package gates pass. The additional root `pnpm build` check is
    blocked by pre-existing route changes that pass `ROUTES.*` constants to
    `createFileRoute`, which the installed TanStack generator rejects because it requires
    literal route IDs.

- [ ] **T6.2** — Validate the dialog through its Q3-designated real application consumer
  with Playwright MCP; do not substitute a standalone HTML harness.
  - **Depends on:** T3.2v, T3.3v, T3.4v, T5.9t, Q3
  - **Observable result:** with local infrastructure and the real Server/Web running via
    `docker compose up`, `pnpm --filter server dev`, and `pnpm --filter web dev`, the
    recorded browser result covers opening from the actual trigger; valid/invalid lookup;
    existing and not-found states; natural and legal drafts; partial address error;
    unchecked and selected consents; review edits; successful creation; registration
    `409` recovery; partial consent failure and pending-only retry; callback/close; focus
    restoration; keyboard traversal; accessible names, errors, `aria-current`, and live
    state in the accessibility snapshot; light/dark and reduced-motion behavior; and a
    narrow viewport without horizontal overflow. Browser console errors and failed
    network requests are inspected and the observed outcome is recorded.
  - **Layer:** `test`
  - **Workspace:** `web`
  - **Validation:** Playwright MCP must exercise the real consumer and REST requests with
    synthetic test data only. If Q3 remains unresolved or the consumer is not runnable,
    record the environment/product blocker and do not claim browser validation.
