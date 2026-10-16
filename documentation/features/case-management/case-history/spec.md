---
title: Consolidated case history
status: in_progress
revision: 3
source:
  type: direct-request
  ref: "Current conversation: implement T3XLf7; persisted records rather than every row a domain event; first delivery existing records, manual updates and task/deadline capture"
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/45613057
scope: [packages/core, packages/validation, apps/server, apps/web]
last_updated_at: 2026-10-13
---

# Consolidated case history

## Objective

Replace static/synthesized case timeline data with the working Histórico tab represented by Pencil T3XLf7: chronological persisted events, filter/search and incremental loading. Preserve original source history and begin atomic task/deadline history capture. Manual updates remain a supported server capability but are excluded from this screen.

## Scope

Selected user delivery: full consolidated reading of existing team/document/waiver/opening receipts, manual registration with optional existing-document references, prospective task/deadline capture and corresponding UI. The current user decision excludes manual entries from the Histórico tab and removes its manual registration/filter controls; it does not delete stored records or change the manual REST contract. REQ-015 is partially delivered; absent lifecycle/priority writers, automatic overdue detection, full Production event capture and retrospective reconstruction of missing changes are deferred by the explicit slice decision. No new domain event or Inngest job is needed for Case-owned atomic recording.

Active eligible Case members retain the authorized manual-update API capability; active Administrators read without membership and cannot register manual updates. Closed Cases remain readable, with manual registration unavailable. The manual-update form remains covered as a component/backend capability but is no longer launched from the Histórico tab. Existing task action eligibility and state rules remain unchanged; this slice adds transactional recording to successful existing actions rather than changing their business semantics. Source document permissions remain independent.

## Behavior Contract

### Functional requirements

- RF-01 — Case PRD v8 REQ-015: combine real opening receipts, team and documentary histories with new general records in one globally ordered, searchable/filterable feed. Never infer historical edits from current updatedAt, fabricate creator identity, duplicate source records or use CASE_TIMELINE as data. Legacy attachment records show Documento associado, without claiming upload vs selection or a prior replaced reference.
- RF-02 — REQ-015 security and current user Admin reversal: authorize every page using ReadContent. Active eligible current members and active Admin can read; removed/inactive/ineligible members and anonymous actors are denied. New manual writes use WriteContent and reject closed Cases/Admin-only actors. Referenced document content requires ReadDocument plus source-owned authorization; history access does not grant download.
- RF-03 — REQ-015 and T3XLf7: newest occurrence first with stable ID tie-breaker, date grouping in America/Sao_Paulo, automatic-source type filters, text search and Carregar mais preserving filters. Filter changes reset the feed. Existing source attribution without a snapshot is explicitly current-name enrichment; missing names use a neutral unavailable-author label.
- RF-04 — REQ-015 manual andamento: eligible member confirms nonempty trimmed description, a valid occurrence date/time and zero or more same-client currently readable existing client documents. Occurrence time and server recorded time stay separate. No implicit upload, checklist mutation, source copy or document validation. Date supplied by the operator is displayed as such; no invented backdated actor/time. Future occurrence time is rejected because an andamento records a completed occurrence, not a planned task. No arbitrary minimum justification length.
- RF-05 — REQ-015 reliability: manual operationId is actor/case scoped, fingerprint includes canonical description/date/document set; replay returns the committed record, changed payload conflicts. Record/source validation/idempotency are transactional. No edit/delete API for history. Corrections are new manual entries. Failed storage/source access or transaction does not create a false record.
- RF-06 — REQ-015 task/deadline changes: each successful create/update/completion/soft-delete appends one immutable record containing actor/time and relevant before/after snapshot in the same transaction as the owning mutation. ProcessDeadline uses deadline labels; deletion is cancellation. One update may include assignment/date/status changes in one factual event, with completion labeled separately. CAS rejection rolls back both writes; no retrospective edits invented. Existing task creation retry semantics remain unchanged; no new idempotency claim for its existing API.
- RF-07 — T3XLf7/Design: real event header/title/time/description/author, subtle date bands, compact separated white rows, filter/search toolbar and pill Load more. Manual dialog retains inputs on failures, disables duplicate submission, manages focus and fits390×844; keyboard navigation works. Loading/empty/search-empty/forbidden/failure/recovery are explicit.
- RF-08 — Current user decision: the Histórico screen excludes every `manual` category entry from all rendered pages, offers no manual category filter or registration action, and describes the feed as automatic events. Manual records remain persisted and available through the existing authorized backend contract.

### Acceptance criteria

| ID | Requirements | Observable result | Checks |
| --- | --- | --- | --- |
| CA-01 | RF-01,03 | Mixed sources including equal timestamps paginate once in global descending order; live keyset semantics for late inserts are explicit; search/category/cursor preserved; no fake seed timeline | AUTO-01, AUTO-02, MAN-01 |
| CA-02 | RF-02 | Real active Admin/member reads; inactive/foreign/removed/anonymous denied; Admin/closed manual writes denied without effects; protected downloads independently denied | AUTO-01, AUTO-02, AUTO-03, MAN-01 |
| CA-03 | RF-04,05 | Manual description/date/docs persisted exactly with server actor/time, immutable references; same operation replay deduplicates, changed payload409, missing/foreign/inaccessible source no record | AUTO-01, AUTO-02, AUTO-03, MAN-02 |
| CA-04 | RF-06 | Real task/deadline create/update/complete/delete produce exact before/after history; stale concurrent write/failing history append leaves no partial mutation | AUTO-01, AUTO-02, AUTO-03 |
| CA-05 | RF-07 | Desktop and390×844 match reference; typing/filter/load-more/retry/keyboard focus and cancellation work; no horizontal overflow | AUTO-04, MAN-01, VIS-01 |
| CA-06 | RF-08 | Mixed automatic/manual API pages show only automatic events; the screen has no manual filter or registration action and keeps automatic pagination usable | AUTO-05 |

## Technical Contract

### Architecture Mapping

Case Management owns business decisions, records and consolidation. SQL UNION ALL is confined to Case-owned tables; no cross-module database-model imports. Existing ClientDocumentsProvider is the public documentary boundary. Actor labels use CaseCollaboratorsProvider. Source history is read directly without duplicated backfill. Record append/source validation/task mutation participate in existing ambient PostgreSQL transactions through a feature history transaction port. Core stays framework-free. Validation owns request syntax. Web domain hooks own query/cache/mutations; widgets own forms and presentation.

| Action | Boundary | Element / Path | Required change |
| --- | --- | --- | --- |
| Create | Core | case-history-kind/category/cursor/query/page/document-reference structures; case-history-entry/record/record-creation entities under packages/core/src/case-management/domain | Canonical values and immutable documentary/task snapshots; exports/fakers |
| Create | Core | CaseHistoriesRepository, CaseHistoryTransactionProvider, CaseHistoryService in interfaces | Unified cursor feed, append/idempotency and REST parity |
| Create | Core | ListCaseHistoryUseCase, RegisterCaseUpdateUseCase, ListCaseHistoryDocumentsUseCase, ReadCaseHistoryDocumentUseCase and owning tests | Trusted context, permissions, filtering/cursor, manual idempotency and fixed-document read |
| Modify | Core | create/update/delete-case-task-use-case.ts and owning tests | Atomic task mutation plus immutable recording; all constructor consumers supplied new ports |
| Modify | Core | interfaces/case-team-management-service.ts, entity/structure/interface/use-case barrels | Expose history service without breaking existing operations |
| Create | Validation | schemas/case-history-schema.ts and owning schema tests, export barrel | Strict category/search/cursor/limit and manual occurrence/description/docIDs/operation syntax |
| Create | Server | case-history-record-model/mapper/types/repository plus CaseHistoryTransactionProvider under Case-owned database/provision | Append-only general records, global Case-source UNION and source-key uniqueness; no remove/edit public methods |
| Create | Server | list-case-history, register-case-update, list-case-history-documents, read-case-history-document REST controllers and own HTTP tests | Real Auth guards, UUID context, shared schemas, server-owned actor and source guard |
| Modify | Server | Case database/module/tokens/seeder, task controllers, schema.ts and generated migration/meta, REST examples | Bind concrete ports, adjust all task constructor consumers, orderly test seeder cleanup; generated additive migration only |
| Modify | Web | rest/services/case-management-service.ts and owning tests | History list/manual/list documents/exact read parity |
| Create | Web | ui/case-management/hooks/use-case-history-query.ts, use-register-case-update-action.ts, use-case-history-documents-query.ts | Actor-scoped infinite query, filter keys, forbidden cache purge, manual invalidation |
| Create | Web | ui/case-management/widgets/components/case-history with local hook, filters/date-group/event-row/manual-update-dialog and owning tests | T3XLf7 presentation, query/empty/retry/load-more, form and existing-document references |
| Modify | Web | ui/case-management/widgets/components/case-history and ui/identity/widgets/pages/lawyer-page/my-case-page case-tab-panels; affected tests/browser fixture | Show automatic categories only, omit manual filter/action, consume actual API; no fake static timeline |

Expected affected file trees (ordinary internal widgets/faker naming may be refined within these boundaries):

```text
packages/core/src/case-management/
├── domain/entities/{case-history-entry,case-history-record,case-history-record-creation}.ts [N]
├── domain/entities/fakers/case-history-record-faker.ts [N]
├── domain/structures/{case-history-kind,case-history-category,case-history-cursor,case-history-cursor-envelope,case-history-query,case-history-page,case-history-document-reference,case-history-task-snapshot}.ts [N]
├── interfaces/{case-histories-repository,case-history-transaction-provider,case-history-service}.ts [N]
├── interfaces/case-team-management-service.ts [M]
├── use-cases/{list-case-history,register-case-update,list-case-history-documents,read-case-history-document}-use-case.ts [N]
├── use-cases/{create,update,delete}-case-task-use-case.ts [M]
├── use-cases/tests/<matching owning use-case>.test.ts [N/M]
└── domain/{entities,entities/fakers,structures}/index.ts; interfaces/index.ts; use-cases/index.ts [M]
packages/validation/src/case-management/schemas/
├── case-history-schema.ts [N]
├── tests/case-history-schema.test.ts [N]
└── index.ts [M]
apps/server/src/case-management/
├── database/drizzle/models/case-history-record-model.ts [N]
├── database/drizzle/mappers/drizzle-case-history-mapper.ts [N]
├── database/drizzle/types/entities/drizzle-case-history-projection.ts [N]
├── database/drizzle/repositories/drizzle-case-histories-repository.ts [N]
├── database/drizzle/case-history-transaction-provider.ts [N]
├── rest/controllers/{list-case-history,register-case-update,list-case-history-documents,read-case-history-document}.controller.ts [N]
├── rest/controllers/tests/<matching controller>.test.ts [N]
├── rest/controllers/{create,update,delete}-case-task.controller.ts [M]
├── fixtures/case-history-flow-fixture.ts [N]
└── case-management.module.ts; database/module/seeder/barrels; constants tokens [M]
apps/server/src/shared/database/drizzle/schema.ts; migrations/<generated SQL/meta/journal> [M/N, generated]
apps/server/rest-client/case-management/cases.rest [M]
apps/web/src/
├── rest/services/case-management-service.ts; tests/case-management-service.test.ts [M]
├── ui/case-management/hooks/use-case-history-query.ts [N]
├── ui/case-management/hooks/use-register-case-update-action.ts [N]
├── ui/case-management/hooks/use-case-history-documents-query.ts [N]
├── ui/case-management/widgets/components/case-history/index.tsx; use-case-history.ts [N]
├── ui/case-management/widgets/components/case-history/{filters,date-group,event-row}/index.tsx [N]
├── ui/case-management/widgets/components/case-history/register-update-dialog/index.tsx; use-register-update-dialog.ts [N]
├── ui/case-management/widgets/components/case-history/tests/{case-history.test.tsx,use-case-history.test.ts} [N]
├── ui/case-management/widgets/components/case-history/register-update-dialog/tests/<owning widget/hook>.test.ts[x] [N]
└── ui/identity/widgets/pages/lawyer-page/my-case-page/{case-tab-navigation,case-tab-panels}/index.tsx; tests/<affected>.test.tsx [M]
apps/web/tests/case-management/case-history-page.test.ts; fixtures/case-history-fixture.ts [N]
```

Consequential declarations follow. Each exported type resides in its named file; inline snippets below specify contracts, not file colocation. Kinds cover only selected existing and prospective sources: case_opened; team_added/removed/role_changed/eligibility_changed/legacy_imported; document_associated/requirement_validated; waiver_granted/revoked/replaced; task_created/updated/completed/deleted; deadline_created/updated/completed/cancelled; manual_update. Categories: case, team, documents, waivers, tasks, deadlines, manual. A category is a query grouping, not a domain event class.

```typescript
export const CaseHistoryCategory = {
  Case: 'case', Team: 'team', Documents: 'documents', Waivers: 'waivers',
  Tasks: 'tasks', Deadlines: 'deadlines', Manual: 'manual',
} as const

export type CaseHistoryCategory = (typeof CaseHistoryCategory)[keyof typeof CaseHistoryCategory]

export const CaseHistoryKind = {
  CaseOpened: 'case_opened', TeamAdded: 'team_added', TeamRemoved: 'team_removed',
  TeamRoleChanged: 'team_role_changed', TeamEligibilityChanged: 'team_eligibility_changed',
  TeamLegacyImported: 'team_legacy_imported', DocumentAssociated: 'document_associated',
  RequirementValidated: 'requirement_validated', WaiverGranted: 'waiver_granted',
  WaiverRevoked: 'waiver_revoked', WaiverReplaced: 'waiver_replaced',
  TaskCreated: 'task_created', TaskUpdated: 'task_updated', TaskCompleted: 'task_completed',
  TaskDeleted: 'task_deleted', DeadlineCreated: 'deadline_created', DeadlineUpdated: 'deadline_updated',
  DeadlineCompleted: 'deadline_completed', DeadlineCancelled: 'deadline_cancelled',
  ManualUpdate: 'manual_update',
} as const

export type CaseHistoryKind = (typeof CaseHistoryKind)[keyof typeof CaseHistoryKind]

export type CaseHistoryDocumentReference = {
  readonly clientDocumentId: string
  readonly source: ClientDocumentSource
  readonly name: string
}

export type CaseHistoryCursor = { occurredAt: Date; id: string }

export type CaseHistoryCursorEnvelope = {
  caseId: string
  category?: CaseHistoryCategory
  search: string
  before: { occurredAt: string; id: string }
}

export type CaseHistoryTaskSnapshot = {
  readonly taskId: string
  readonly version: number
  readonly type: CaseTaskType
  readonly title: string
  readonly description: string
  readonly customType?: string
  readonly reminders: readonly { readonly value: number; readonly unit: 'minutes' | 'hours' | 'days' }[]
  readonly completedAt?: string
  readonly completedById?: string
  readonly plannedDate: string
  readonly plannedTime?: string
  readonly status: CaseTaskStatus
  readonly assigneeIds: readonly string[]
  readonly blocksCaseClosure: boolean
  readonly completionNote?: string
  readonly deletedAt?: string
}

export type CaseHistoryQuery = {
  caseId: string
  actorId: string
  category?: CaseHistoryCategory
  search?: string
  cursor?: string
  limit?: number
}

export type CaseHistoryEntry = Entity & {
  caseId: string
  kind: CaseHistoryKind
  category: CaseHistoryCategory
  occurredAt: Date
  recordedAt: Date
  actorId?: string
  actorName?: string
  title: string
  description: string
  documents: readonly CaseHistoryDocumentReference[]
  details?: Readonly<Record<string, unknown>>
  taskChange?: { readonly before?: CaseHistoryTaskSnapshot; readonly after: CaseHistoryTaskSnapshot }
}

export type CaseHistoryRecord = CaseHistoryEntry & {
  sourceKey: string
  operationId?: string
  fingerprint?: string
}

export type CaseHistoryRecordCreation = Omit<CaseHistoryRecord, 'id'>

export type CaseHistoryPage = {
  items: readonly CaseHistoryEntry[]
  nextCursor?: string
}

export interface CaseHistoriesRepository {
  listByCaseId(query: {
    caseId: string
    category?: CaseHistoryCategory
    search?: string
    before?: CaseHistoryCursor
    limit: number
  }): Promise<readonly CaseHistoryEntry[]>
  findManualOperation(caseId: string, actorId: string, operationId: string): Promise<CaseHistoryRecord | undefined>
  findById(caseId: string, entryId: string): Promise<CaseHistoryEntry | undefined>
  add(record: CaseHistoryRecordCreation): Promise<CaseHistoryRecord>
}

export interface CaseHistoryTransactionProvider {
  runInTransaction<T>(callback: () => Promise<T>): Promise<T>
}

export interface CaseHistoryService {
  listCaseHistory(caseId: string, query: Omit<CaseHistoryQuery, 'caseId' | 'actorId'>): Promise<RestResponse<CaseHistoryPage>>
  registerCaseUpdate(caseId: string, request: {
    operationId: string
    occurredAt: string
    description: string
    documentIds: readonly string[]
  }): Promise<RestResponse<CaseHistoryEntry>>
  listCaseHistoryDocuments(caseId: string): Promise<RestResponse<readonly ClientDocument[]>>
  readCaseHistoryDocument(caseId: string, entryId: string, documentId: string): Promise<RestResponse<Blob>>
}
```

Use-case signatures:

```typescript
ListCaseHistoryUseCase.execute(request: CaseHistoryQuery): Promise<CaseHistoryPage>
RegisterCaseUpdateUseCase.execute(request: {
  caseId: string; actorId: string; operationId: string;
  occurredAt: string; description: string; documentIds: readonly string[];
}): Promise<CaseHistoryEntry>
ListCaseHistoryDocumentsUseCase.execute(request: {caseId: string; actorId: string}): Promise<readonly ClientDocument[]>
ReadCaseHistoryDocumentUseCase.execute(request: {
  caseId: string; actorId: string; entryId: string; documentId: string;
}): Promise<{document: ClientDocument; bytes: Uint8Array}>
```

List uses limit20 default/max50 and fetches limit+1 for next cursor. Cursor is an opaque encoded occurredAt/id tuple carrying Case ID and canonical category/search context, strictly validated before querying; changed Case/filter context rejects it, stable descending tie-breaker. Encoding is not authorization: Case authorization precedes decoding and queries remain Case scoped. IDs are source-namespaced (opening/team/document/record) to avoid collisions. Search uses bound escaped literal matching, not arbitrary SQL wildcards; sort/filter/limit apply after union. Source rows remain authoritative; no historical JSON mutation/backfill. Metadata descriptions use server-owned mappings; current title/name enrichment is not misrepresented as immutable snapshot. General record details snapshot before/after task fields; no credentials or file bytes included. General sourceKey is unique per Case (task ID/revision/action); manual operation uniqueness case/actor/operation and fingerprint replay checked atomically. Task write/history failure rolls back assignees/reminders and CAS changes. Nested adapter transactions preserve ambient executor/savepoint consistency.

REST paths and responses:

| Method / path | Request | Success | Failures |
| --- | --- | --- | --- |
| GET /cases/:caseId/history | category/search/cursor/limit | 200 CaseHistoryPage | 400 malformed query/cursor,401/403,404 Case |
| POST /cases/:caseId/history/updates | operationId UUID, occurredAt ISO datetime, trimmed nonempty description <=5000, unique documentIds UUID array <=20 | 201 CaseHistoryEntry; identical replay same record | 400 bad/future occurrence,401/403,404 source/Case,409 changed replay |
| GET /cases/:caseId/history/documents | no body; WriteContent eligibility for manual selection | 200 ClientDocument[] | 401/403/404 |
| GET /cases/:caseId/history/:entryId/documents/:documentId/content | namespaced entry ID encoded; document UUID | 200 exact authenticated bytes with safe content-type/name | 401/403/404; source authorization separately enforced |

Queries/DTOs derive from owning use-case parameters, excluding server-derived actor/path fields. Requests cannot choose automatic kind, actor/name, case/client metadata or recordedAt. Strict reusable Zod schemas use canonical enums, UUIDs/ISO dates and trim; future date policy stays Core. Manual dialog chooses existing documents through the new item-independent endpoint; no hidden checklist attachment side effect. Open historical document rechecks entry membership, reference identity and current source readability; fixed sources are preserved, and filenames/mime/extensions follow current safe reader behavior.

Constructor contracts: ListCaseHistoryUseCase receives CaseAccessProvider, CaseHistoriesRepository and CaseCollaboratorsProvider. RegisterCaseUpdateUseCase receives LegalCasesRepository, CaseAccessProvider, CaseHistoriesRepository, CaseHistoryTransactionProvider, ClientDocumentsProvider, CaseCollaboratorsProvider and DatetimeProvider. ListCaseHistoryDocumentsUseCase receives LegalCasesRepository, CaseAccessProvider and ClientDocumentsProvider. ReadCaseHistoryDocumentUseCase receives LegalCasesRepository, CaseAccessProvider, CaseHistoriesRepository and ClientDocumentsProvider. The three existing task use cases retain their existing task/member/time ports and additionally receive CaseHistoriesRepository and CaseHistoryTransactionProvider; update all application/test constructors. Histories resolve unknown actor names at read time rather than invent snapshots. New structural files and faker/export tree entries include case-history-cursor-envelope.ts and case-history-task-snapshot.ts.

Manual replay ordering: inside the serializable transaction recheck current WriteContent authorization and validate/canonicalize request/fingerprint, then lookup existing actor/case/operation. An identical committed operation returns its existing safe metadata even if a referenced source was revoked later; it does not re-serve bytes or grant access. Different fingerprint409. Only new operations resolve all sources/current eligibility before appending. Document reads recheck case/source permissions and compare historical reference source discriminant AND every fixed ID (fileId, consultationId/documentId/versionId, formalizationId/requestDocumentId/artifactId) to the resolved/read ClientDocument.source before returning bytes; mismatch404/no bytes.

Live cursor semantics: a page is not a frozen snapshot. New records ahead of the consumed boundary appear after refresh/reset; newly recorded backdated occurrences below that boundary may appear on subsequent pages. Existing immutable entries never repeat. Millisecond timestamp normalization used by cursor ordering/comparison must match JSON Date precision across every union source, including microsecond PostgreSQL timestamps; source timestamps are not rewritten. Search is literal matching on event title/description; current-name enrichment is not promised as a searchable historical snapshot.

Complete reusable syntax contracts (exports remain schemas only; Core performs permission/future-date/idempotency):

```typescript
export const caseHistoryQuerySchema = z.object({
  category: z.enum(CaseHistoryCategory).optional(),
  search: z.string().trim().max(200).optional(),
  cursor: z.string().min(1).max(2048).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict()

export const registerCaseUpdateSchema = z.object({
  operationId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  description: z.string().trim().min(1).max(5000),
  documentIds: z.array(z.uuid()).max(20).default([]),
}).strict()
```

Duplicate document IDs are normalized to a sorted unique set in Core for canonical fingerprint and fixed references. UI occurrence datetime-local is explicitly interpreted in America/Sao_Paulo and serialized as ISO with offset, rather than depending on device timezone; a shared date formatting hook may be introduced if multiple widgets consume the same format. Server recordedAt is always authoritative time.

Public Web contracts:

```typescript
export type CaseHistoryProps = {
  caseId: string
}

export type RegisterUpdateDialogProps = {
  caseId: string
  onClose: () => void
  onRegistered: (entry: CaseHistoryEntry) => void
}

useCaseHistoryQuery({ caseId, actorId, category, search }): {
  entries: readonly CaseHistoryEntry[]; isLoading: boolean; error: unknown;
  hasNextPage: boolean; isFetchingNextPage: boolean;
  fetchNextPage(): Promise<unknown>; refetch(): Promise<unknown>;
}

useRegisterCaseUpdateAction(caseId): {
  registerUpdate(request: Parameters<CaseHistoryService['registerCaseUpdate']>[1]): Promise<CaseHistoryEntry>;
  isRegistering: boolean; error: unknown;
}

useCaseHistoryDocumentsQuery({ caseId, actorId, enabled }): {
  documents: readonly ClientDocument[]; isLoading: boolean; error: unknown;
  refetch(): Promise<unknown>;
}
```

CaseHistory local hook owns filters/debounced search, grouping/status/recovery and dialog state; manual dialog local hook owns occurrence/description/selection/operationId/pending/errors/focus. Domain action/query hooks own API calls and actor/filter-aware cache keys; forbidden removes protected data. Admin/closed readOnly comes from trusted current collaborator profile and current Case state. Document-reference buttons use owning authenticated service, safe extension/content type and current source guard, never unauthenticated public URLs. Service/parser methods retain existing response classes and query serializers.

Generated migration creates only Case-owned append-only general records and necessary indexes/constraints; no destructive resets or journal surgery. Existing tables/data preserved. Case-owned seeder clears new dependent records before Cases through repository contract infrastructure, not raw seeder SQL. Use `pnpm --filter server db:migration:generate` after models stable; inspect generated SQL. Use disposable fixtures for automated/mutating Manual validation. The authorized feature includes preparing its intended local development schema: verify the actual local Server connection and absence of the new table, save a private ignored backup, then apply only the inspected generated0068 additive table/FK/index SQL transactionally with bounded lock/statement timeouts. Preserve existing rows and migration journal; never replay divergent pending migrations or reset/reseed shared data. Read back schema/indexes and existing data before verifying the running application endpoint. Deployed migration remains outside this local task.

### Runtime Flow

```mermaid
sequenceDiagram
  participant UI as History tab
  participant API as Case REST
  participant Core as Case history use case
  participant DB as Case repositories
  UI->>API: GET category/search/cursor
  API->>Core: Trusted actor + Case
  Core->>Core: ReadContent authorization; validate cursor
  Core->>DB: Global ordered/filterable union, limit+1
  DB-->>Core: Real source records
  Core-->>UI: Safe summaries + next cursor
  UI->>API: POST manual description/occurrence/docs/operation
  API->>Core: Trusted actor + strict input
  Core->>Core: WriteContent; validate date/source access
  Core->>DB: Transaction: replay check + append fixed references
  DB-->>UI: Committed record or no-effect error
```

```mermaid
sequenceDiagram
  participant Actor as Task caller
  participant Core as Owning task use case
  participant DB as Ambient transaction
  Actor->>Core: Existing create/update/delete request
  Core->>DB: Begin; existing validation and CAS
  Core->>DB: Persist task and immutable before/after record
  alt History or task write fails
    DB-->>Actor: Rollback both; recoverable error
  else Commit succeeds
    DB-->>Actor: Existing task response; one history record
  end
```

## Verification Contract

### Automated

#### AUTO-01 — Core behavior and syntax
CA-01–04. Owning list/manual/doc-list/read/task use-case tests and reusable schema tests cover all seven categories, equal-time cursor boundaries, invalid/cross-Case cursor context, blank/literal-wildcard search, future/invalid occurrence, active Admin/member/removed/inactive/ineligible/closed states, no document IDs/eligible three source kinds/foreign source/revoked source, manual replay/changed payload, task create/update/status/date/assignment/completion/delete, CAS and injected append failure rollback boundaries. Use canonical fakers and typed port mocks. Run focused Core/Validation tests, type/lint/architecture and current changed-code coverage for affected source; old test outcomes remain historical if correction follows.

#### AUTO-02 — Native HTTP/persistence
CA-01–04. New owning four controller files under Case rest/controllers/tests and affected existing task controller files. Real Auth/PostgreSQL and existing source Storage fixture or ChecklistDocumentFlowFixture for document reference/read. Prove global union order/filter/cursor including equal timestamps and inserts between pages; Admin read/denied write, foreign/removed/inactive access, exact actor/time/manual links, replay201 sameID, changed409 and no wrong-client entries. Actual task CAS/history one transaction including induced history failure and concurrent version conflict; no direct adapter tests. Serialize all container runs; no shared seed/reset. Migration fixtures preserve legacy team/docs records and new constraints. Run affected Server types/lint/architecture/build and current changed-code coverage; broaden only for concrete shared transaction risk.

#### AUTO-03 — Mutation correctness
CA-02–04. Target authorization, manual idempotency/reference/date and task transaction predicates. HMS lacks configured mutation tooling: this remains Blocked until real runner is authorized/provided; ordinary test/coverage does not satisfy it.

#### AUTO-04 — Web behavior and routes
CA-01–03,05–06. Owning widget test mocks its UI hook; separate hook tests mock HMS domain dependencies. Cover initial/pagination pending, true-empty/filter-empty, failure/retry, filter reset, appended grouping, manual-entry exclusion, removed-access cache purge and automatic pagination. Keep standalone manual-dialog component and server contract tests as backend capability coverage. Focused mocked Playwright case-history-page.test.ts proves mixed pages hide manual rows, no manual filter/action appears, and automatic filters/search/load more work at keyboard/390px. Mocked routes are not native REST proof. Run affected Web types/lint/architecture/build and current changed coverage.

#### AUTO-05 — Exclude manual entries from the Histórico screen
CA-06. Unit-test the owning hook with mixed Manual and automatic categories across returned pages; assert no manual entry reaches date groups and automatic pagination remains available. Component and mocked route tests assert no manual filter/registration controls and no manual row is rendered. Existing manual API/action/dialog checks remain valid for the server capability but do not satisfy this UI criterion.

### Executable selections and baseline gates

Run from repository root; native Server container selections are serialized. During building use focused tests without coverage:

```bash
pnpm --filter @hms/core test src/case-management/use-cases/tests/list-case-history-use-case.test.ts src/case-management/use-cases/tests/register-case-update-use-case.test.ts src/case-management/use-cases/tests/list-case-history-documents-use-case.test.ts src/case-management/use-cases/tests/read-case-history-document-use-case.test.ts src/case-management/use-cases/tests/create-case-task-use-case.test.ts src/case-management/use-cases/tests/update-case-task-use-case.test.ts src/case-management/use-cases/tests/delete-case-task-use-case.test.ts
pnpm --filter @hms/validation test src/case-management/schemas/tests/case-history-schema.test.ts
pnpm --filter server exec vitest run src/case-management/rest/controllers/tests/list-case-history.controller.test.ts src/case-management/rest/controllers/tests/register-case-update.controller.test.ts src/case-management/rest/controllers/tests/list-case-history-documents.controller.test.ts src/case-management/rest/controllers/tests/read-case-history-document.controller.test.ts src/case-management/rest/controllers/tests/create-case-task.controller.test.ts src/case-management/rest/controllers/tests/update-case-task.controller.test.ts src/case-management/rest/controllers/tests/delete-case-task.controller.test.ts --no-file-parallelism
pnpm --filter web test src/ui/case-management/widgets/components/case-history src/rest/services/tests/case-management-service.test.ts src/ui/identity/widgets/pages/lawyer-page/my-case-page/tests
pnpm --filter web exec playwright test tests/case-management/case-history-page.test.ts
```

Integrated gates: `pnpm --filter @hms/core check-types`, `pnpm --filter @hms/validation check-types`, `pnpm --filter server check:types`, `pnpm --filter web check:types`; each workspace's `check:architecture` and `check:complexity`; Core/Validation `lint`, Server/Web `check:lint`; `pnpm --filter server build` and `pnpm --filter web build`. Run `pnpm --filter <workspace> test:coverage:changed --base HEAD -- <same affected selectors>` for Core, Server and Web after integration. The existing aggregate dirty candidate includes unrelated changes: retain its observed result and separately identify current history source coverage rather than claim aggregate percentages prove only this feature. Validation has no changed-coverage script; its schema assertions/types/lint/architecture remain required. Full integration broadening follows Tooling's shared-boundary criteria, not a role transition.

### Manual

#### MAN-01 — Read/filter/page on actual services
CA-01,02,05–06. Playwright CLI named hms-case-history from apps/web against healthy localWeb/Auth/REST or isolated task fixture. Resolve source-verified seed member and Admin credentials privately; no auth-state output. Open the shared case detail and Histórico, verify known persisted automatic documentary/team rows, manually persisted rows remain hidden, search/category reset and Carregar mais. Inspect relevant real network/statuses and final content. At390×844 verify nooverflow and keyboard filter/load-more. Close only taskbrowser/services, leave sharedDocker untouched.

#### MAN-02 — Register/update/read documentary reference
CA-03,05. Isolated CaseHistory fixture/harness with active member/open Case and source-backed same-client documents; setup through real ports, not shared mutations. Open Registrar andamento, verify occurrence/description/optional existing-document selector; empty invalid disables/valid enables, cancel no record. Confirm and refresh: same record/context/actor/time and safe fixed reference open. Recover a controlled failure/retry without losing input; prove no duplicate. Escape/keyboard focus restored, mobile body scroll/header/footer visible. Record occurrence vs recordedtime separately. No actual API permissions inferred from browser mocks.

### Visual

#### VIS-01 — T3XLf7
CA-05–06. Inspect fresh desktop and390×844 actual Manual screenshots against PencilT3XLf7. Required secondary date bands/white separated rows, event title/time/description/author, compact filter/search toolbar and pill footer Load more; manually persisted entries remain absent from rendered groups. Design fixture names/dates/events are never production data. Reference is read through Pencil only; implementation artifacts ignored under apps/web/.playwright-cli. Verify appearance rather than capture-only evidence.

## Documentation Alignment

Case PRD v8 REQ-015/JN-009 governs immutable consolidated history and manual occurrence/docs; REQ-011/012 govern existing task/deadline actions. User explicitly selected the partial first delivery, with future lifecycle/overdue/Production capture deferred. No Confluence/Jira mutation requested. Modules/Architecture owns public module boundaries. Rules selected: code-conventions, Core/usecase/Validation/REST/controllers/database/provision/UI/widget/Web integration/route when affected; Tooling execution schedule/coverage/mutation applies. Source research found frozen CodeGraph auto-sync and competing worktree results; current root targeted sources verified. Design/handoff records Pencil reference and UI adaptations. No new dependency, scheduler or infrastructure integration.

## Revision History

| Revision | Date | Change | Authority |
| --- | --- | --- | --- |
| 1 | 2026-10-13 | Initial selected consolidated history/manual/task capture with truthful existing sources and independent source permissions | User explicit slice reply, PRDv8 REQ-015, PencilT3XLf7 |
| 2 | 2026-10-13 | Correct invented blanket local-DDL approval restriction to authorized additive local preparation with preflight/backup/transaction/readback; RF/CA and selected behavior unchanged | User implementation authorization, AGENTS/Tooling, bounded history_migration_review |
| 3 | 2026-10-13 | Exclude manual category entries and controls from the Histórico screen while preserving server persistence and REST capability | Current user request |

## Checklist confirmation source — direct request 2026-10-13

Include `checklist_confirmed` in the consolidated history when the persisted Case checklist gate decision is Approved or ApprovedWithException and has its saved decision timestamp. Title `Checklist confirmado`; documents category; occurrence/recorded time from the decision timestamp, actor from decidedBy with existing authorized collaborator enrichment, decision/remarks preserved in details. Stable per-Case source identifier prevents duplication and participates in existing search/filter/keyset pagination. Existing approvals are visible without backfill or fabricated events. Pending, blocked and rejected decisions must not produce confirmation. Invalidate Case history queries after approval/homologation so cached history reflects confirmation. This is a history projection, not a new messaging publication.
