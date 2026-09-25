---
title: Novas versões de peças jurídicas por edição manual ou geração assistida
status: draft
revision: 1
sources:
  - type: prd
    ref: https://plataformahms.atlassian.net/wiki/spaces/PHMS/pages/2588673/PRD+M+dulo+de+Produ+o+Documental
    role: product_requirements
  - type: direct-request
    ref: codex-task
    role: delivery_scope
scope:
  - packages/core/src/case-management/use-cases
  - packages/core/src/document-production/domain
  - packages/core/src/document-production/interfaces
  - packages/core/src/document-production/use-cases
  - packages/validation/src/document-production
  - apps/server/src/document-production/rest/controllers
  - apps/server/src/document-production/database/drizzle
  - apps/server/src/document-production/messaging/inngest
  - apps/server/src/document-production/ai/mastra
  - apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/case-pieces-tab
  - apps/web/src/ui/identity/widgets/pages/lawyer-page
  - apps/web/src/rest/services/case-document-production-service.ts
  - apps/server/rest-client/document-production
---

# Context and scope

## Objective

Allow an authorized collaborator working on a legal case to create a new version
of an existing legal document through either manual editing or AI-assisted
regeneration. Versions belong to the same document/package item, are immutable
after creation, and remain in history. The author of a version cannot review or
approve that same version.

## Authority and product alignment

The canonical authority is **PRD — Módulo de Produção Documental**, Confluence
page `2588673`, current version 15 (updated 2026-09-21), especially sections
12.2–12.8. Relevant rules:

- 12.2: regeneration is individual and creates another version; failed generation
  creates no version; previous versions are preserved.
- 12.3: each saved version owns its content and DOCX file.
- 12.4: manual editing does not modify the source version; saving creates a new
  `Em revisão` version.
- 12.5: approval or rejection is final for that version; rejection does not erase
  it.
- 12.6: creating a version does not change the current/approved version; only an
  explicit action changes which approved version is current.
- 12.7: all current case collaborators have document permissions; a version's
  author must not review their own document, as decided for this workflow.
- 12.8: review and approved states offer the action to generate a new version;
  manual editing offers save/cancel actions.

The canonical PRD was read through the Atlassian connector. The local repository
summary is `documentation/HMS Memory/Reference/PRDs/PRD - Producao Documental.md`.
No Jira ticket was identified for this direct-request scope.

## Current gap

- The case editor exposes **Versões**, but the case-piece flow does not yet offer
  an end-to-end create-version action from that history.
- Initial case generation creates a new `Document` and package association.
  Calling it again would create another document, not another version of the
  existing piece.
- Retry is limited to a pending/running/failed/cancelled generation and is not a
  regeneration action for a completed piece.
- The case editor currently autosaves content into the opened `DocumentVersion`
  through `saveEditableContent`, mutating a version in place. That conflicts with
  the PRD's immutable-version contract and must be replaced for manual editing.
- Core already models `sourceDocumentVersionId`; `SaveManualConsultationDocumentVersionUseCase`
  is an existing pattern for creating a manual immutable version with its own
  exported file. Case regeneration already carries instructions through the
  generation event, but its current use case creates a new document for initial
  generation.

## In scope

- Version history in the case editor with a **+ Elaborar nova versão** action.
- A choice dialog offering **Edição manual** and **Geração por IA**.
- A persisted editable manual draft, separate from immutable `DocumentVersion`
  records; explicit save creates a manual version in review, cancel abandons the
  working draft without changing the source version.
- AI regeneration for the same document, using a selected prior version as the
  base and retaining its case/dossier references as an immutable source snapshot.
- Required user instructions for AI regeneration, maximum 4,000 characters.
- Version history metadata and transitions for the created manual or AI version.
- Backend authorization, persistence, event, and UI coverage needed for these
  behaviors.

## Out of scope

- Comparing document versions.
- Changing the document template, checklist, case dossier, or reference-document
  associations as part of a new version.
- Automatically approving a version or changing the current/approved version.
- AI deciding whether a generated legal document is fit for filing.
- Reusing documents across cases, PDF export, collaborative simultaneous editing,
  or replacing the existing AI writing/review workflow.
- Changing the general case team's permissions or allowing a version author to
  approve their own work.

## Assumptions and resolved decisions

1. **Same document identity:** both new-version paths target the existing
   `documentId` and package association; they never create a second package item.
2. **Manual draft persistence:** edits autosave to a separate mutable draft tied
   to `{ caseId, documentId, sourceDocumentVersionId, collaboratorId }`. The
   immutable version record and its exported file are created only when the user
   explicitly saves the draft as a manual version. This keeps autosave without
   mutating historical versions or creating a version for every keystroke.
3. **Draft ownership:** only the collaborator who owns a draft may resume, update,
   cancel, or save it. Other case collaborators retain access to document
   versions, but cannot overwrite another user's in-progress draft.
4. **AI baseline:** regeneration uses the explicitly selected version's content,
   the original version's captured case/document evidence, and the new
   instructions. It must not silently fetch later dossier changes or infer facts
   absent from that snapshot.
5. **Version status:** successful AI output and a saved manual draft each create
   a new `in_review` version. Generation failure creates no version and leaves
   all existing versions and current-version selection unchanged.
6. **Current version:** neither path changes `currentVersionId`; approval and
   making a version current remain separate human actions.
7. **Review independence:** the author of a version cannot approve or reject that
   version. A different authorized collaborator may review it.
8. **Concurrent work:** one active AI generation per document is allowed. A
   conflict is reported as recoverable; existing versions remain available.

# Implementation Contract

## Observable requirements

### RF-001 — Open version history and start a new version

The editor's **Versões** action shows all persisted versions of the current
document, including version number, origin (IA/manual), status, author, created
time, current-version indicator, and rejection reason when present. The history
offers **+ Elaborar nova versão** when no generation is active and the user has
case document access.

### RF-002 — Choose the version creation path

**+ Elaborar nova versão** opens a dialog with two explicit options:

- **Edição manual** — open or resume the current user's manual draft based on the
  selected source version; do not create or change an immutable version yet.
- **Geração por IA** — show a required instructions field with a 4,000-character
  limit and an example such as “Considere a versão anterior e acrescente um
  requerimento subsidiário de reafirmação da DER.”

Empty/whitespace-only instructions disable confirmation. The dialog communicates
that a new version will be created for review and that the current version and
history will be preserved.

### RF-003 — Persist and save a manual draft as a new version

Manual editing starts from the selected version's content. Autosave persists only
the mutable draft, never the selected source `DocumentVersion`. The editor shows
whether the draft is saving, saved, or failed to save; unsaved/error state cannot
be represented as saved. On **Salvar edição manual**, the server creates a new
`DocumentVersion` with:

- `source = manual`;
- `sourceDocumentVersionId` equal to the selected source version;
- monotonically increasing `versionNumber` for the same document;
- its own immutable Tiptap content, pending markers, and exported file;
- `status = in_review` and the authenticated collaborator as author.

After success, the draft is closed and the editor navigates to the new version.
Cancel discards only the draft after confirmation when it has changes; the source
version remains byte-for-byte and status-for-status unchanged. Save failures keep
the draft recoverable and do not add a version.

### RF-004 — Regenerate with AI as a new version of the same document

The server validates case membership, document/package ownership, dossier gate,
source-version ownership, and absence of an active generation. It creates a new
generation for the existing `documentId`, with the selected source version and
instructions captured in an immutable `DocumentGenerationSource` snapshot.
Existing case/reference evidence is preserved from that version's generation
source; the browser cannot submit an authoritative source snapshot.

The Inngest/Mastra pipeline receives the selected version content as explicit
baseline and the instructions as user direction. It must treat the source
documents/evidence as the factual basis, preserve correct facts unless instructed
to amend them, and must not invent missing facts. The existing structured-output
and AI review cycle remains in force. On successful workflow completion, the
existing version persistence flow creates another immutable `ai` version for the
same document, linked to its source version and set to `in_review`.

### RF-005 — Preserve history and current selection

Creating either kind of version never deletes or rewrites previous versions,
their exported files, review decisions, rejection reasons, or the selected
current/approved version. The new version is shown in history only after its
persisted state is returned by the server. Generation `pending`/`running` is
shown as generation state, not as a completed version.

### RF-006 — Recover safely from failure and duplicate actions

While an AI generation is pending/running, the new-generation action is disabled
for that document and the active status is visible in the history. `409` refreshes
authoritative history/status without creating duplicates. A failed/cancelled AI
attempt creates no version, preserves the source version, and exposes the
existing retry action with the original instructions/source snapshot. Manual
autosave or final-save errors retain the user's draft and expose retry feedback.

### RF-007 — Enforce independent human review

Only an authorized case collaborator other than the version author may approve or
reject a version. Server-side review must reject self-review even if a client
calls the endpoint directly. Existing reviewer identity/audit metadata is stored
as before.

## Acceptance criteria

### CA-001 — Create a manual version without mutating its source

**Given** an authorized case collaborator is editing a viewable version  
**When** they choose **Edição manual**, change content, autosave, and select
**Salvar edição manual**  
**Then** the server returns a new `manual` version in review, with a higher
version number and a link to the source, while the source content, status, file,
and current-version selection remain unchanged.

### CA-002 — Recover a manual draft after navigation/reload

**Given** a collaborator has a persisted manual draft with unsaved-to-version
changes  
**When** they leave and reopen the same case document  
**Then** they can resume their own draft with its latest successfully autosaved
content; another collaborator cannot overwrite or save it as the owner.

### CA-003 — Cancel a manual draft

**Given** a manual draft is open  
**When** the author cancels and confirms discard  
**Then** the draft is abandoned, no new version is created, and the source version
and history remain unchanged.

### CA-004 — Regenerate from instructions as a new version

**Given** a case document has a persisted version and no active generation  
**When** an authorized collaborator submits valid instructions through **Geração
por IA**  
**Then** a generation is created for the same document using the selected version
as baseline, the immutable case/reference snapshot, and instructions; the history
shows generation status and, on success, a new `ai` version in review linked to
the source version.

### CA-005 — Prevent duplicate or invalid generation

**Given** generation is active, instructions are blank, the selected version does
not belong to the document, or the actor lacks case access  
**When** the client submits another AI version request  
**Then** the server rejects the invalid request or reports the active-generation
conflict without creating a second document, package association, generation, or
version.

### CA-006 — Handle failed generation without losing prior work

**Given** a generation for a new version fails  
**When** the user refreshes the case-piece history  
**Then** the failed attempt is visible as a generation failure, no new version is
listed, and prior version contents, files, status, and current selection remain
intact; retry uses the same source snapshot and instructions.

### CA-007 — Require a different human reviewer

**Given** a version is in review  
**When** its author attempts approval/rejection through the UI or direct REST call
  
**Then** the decision is rejected and the version remains in review; another
authorized case collaborator can decide it.

### CA-008 — Keep prior current version selected

**Given** an approved version is currently selected  
**When** a manual or AI version is created  
**Then** the prior approved/current version remains selected until an authorized
human explicitly makes a different approved version current.

# Technical Contract

## Existing runtime boundaries

- Case-owned authorization and generation-source assembly belong in
  `packages/core/src/case-management`.
- Shared document versions, exports, storage metadata, and generation lifecycle
  belong in `packages/core/src/document-production`.
- Server controllers remain thin; they call core use cases and use repository and
  provider contracts.
- AI tools/workflow belong to Document Production and receive only the immutable
  source snapshot prepared by Case Management.
- The case-piece card/editor and its modal state belong to the Identity UI's
  lawyer case page; API mapping belongs in the case document production service.

## Required flow and state

```text
Editor > Versões > + Elaborar nova versão
  ├─ Edição manual
  │    └─ load/create mutable draft from source version
  │         ├─ autosave draft only
  │         ├─ cancel → discard draft, no version
  │         └─ save → export + insert immutable manual vN (in_review)
  └─ Geração por IA + instructions
       └─ case use case authorizes and snapshots source version/evidence
            └─ publish existing generation-requested event
                 └─ generation/review workflow
                      ├─ failure → no version; preserve source/history
                      └─ success → immutable AI vN (in_review)
```

## Data and persistence decisions

- Keep `DocumentVersion` as the immutable completed-version record; do not use
  `saveEditableContent` for case-piece manual editing.
- Add a dedicated case manual-draft persistence contract/entity storing the
  document ID, source version ID, case ID, draft owner, JSON content, derived
  pending markers, and created/updated timestamps. Enforce at most one active
  draft per `(documentId, sourceDocumentVersionId, collaboratorId)` and authorize
  each operation in the core use case. Draft replacement must be atomic.
- Final manual save exports the draft content to its own DOCX/storage path, adds a
  manual `DocumentVersion` with `sourceDocumentVersionId`, then removes/closes the
  draft only after successful persistence. Export/storage failure must leave the
  draft available and must not insert a partial version.
- AI generation's source snapshot must include `sourceDocumentVersionId`, selected
  base content, original case generation evidence/references, and new instructions.
  Persist this through the existing generation entity/source serialization; do not
  read current case/checklist/document state later from the AI workflow.
- Successful AI version persistence sets `sourceDocumentVersionId` from that
  snapshot. Existing initial generation remains unchanged and may omit it.
- Version numbering continues to derive from the latest persisted version for the
  same `documentId`; concurrent creation must not produce duplicate numbers or
  silently overwrite content.
- The current-version pointer is not changed by draft save, generation request,
  generation completion, or manual version save.

## API and authorization

Add case-scoped operations for manual draft read/create/update/discard/finalize
and AI new-version generation. Exact route names and payload types are finalized
from current REST conventions during the implementation plan; every client-facing
operation has a Core service contract and web adapter. Use shared Zod schemas for
REST payload validation. Requests identify the source version; the server derives
case/source evidence and the authenticated collaborator identity.

Every operation verifies:

- case membership or administrator policy already allowed by this context;
- document exists in the case package;
- source version belongs to that document;
- dossier gate remains eligible for generation;
- the actor owns the targeted manual draft for draft mutation/finalization;
- no active generation exists before starting AI regeneration;
- manual and AI versions are never approved by their own author.

Use existing stable REST error handling: unauthorized/forbidden, not found,
validation error, and conflict are explicit and do not return raw database or AI
details.

## UI contract

- The editor's existing **Versões** control opens a history view; do not add a
  competing top-level action elsewhere on the case page.
- **+ Elaborar nova versão** opens a path-selection dialog. The AI path shows the
  instructions form; the manual path opens/resumes the user's draft editor.
- Manual draft state has explicit saving/saved/error feedback. The final action
  creates a version; it is not described as already versioned while only a draft
  exists.
- History derives from server data and shows each persisted version's source,
  status, author, date, current marker, and available review/open action.
- AI pending/running/failure is presented as generation state without inventing a
  version number before persistence.
- Use existing shadcn Dialog, form, buttons, typography, and semantic design tokens
  from `documentation/design.md`; keyboard focus, narrow reflow, labels, and
  pending/error states are part of acceptance.
- The supplied screenshot of the editor is contextual evidence for the existing
  placement of **Versões**, not a new canonical design reference. No Pencil frame
  or pixel-exact redesign is required by this Contract.

## Required test surfaces

- Core use-case tests for case manual draft lifecycle, manual immutable version
  creation, AI new-version request/source snapshot, retry/failure semantics, and
  self-review protection.
- Validation schema tests for new REST inputs.
- Server controller integration tests using module fixtures and real database
  repositories for manual version/draft persistence and generation request.
- Document Production workflow/tool tests for forwarding the base version snapshot
  and persisting source linkage on successful AI generation.
- Web action-hook and dialog/history widget tests for manual/AI selection, input
  validation, pending/error state, route to new version, and history refresh.
- Authenticated Playwright case flow for manual version and AI request when local
  Docker/Auth/Server/Web services and the configured AI service are available.

# Validation Contract

## Automated sensors

Run focused tests first, then relevant workspace checks:

```bash
pnpm --filter @hms/core test
pnpm --filter @hms/core check-types
pnpm --filter @hms/validation test
pnpm --filter @hms/validation check-types
pnpm --filter server test
pnpm --filter server check:types
pnpm --filter web test
pnpm --filter web check:types
```

Run database migration generation/application checks if the draft table changes
the Drizzle schema. For browser integration, follow the authenticated-browser
workflow in root `AGENTS.md`; report unavailable AI credentials/service as a
blocked live-AI scenario, not as passing evidence.

## Manual scenarios

- **MV-001 — Manual new version:** from an existing case piece, open **Versões**,
  start manual editing, modify and autosave, save the manual version; verify vN+1
  opens and source vN content/file/status are unchanged.
- **MV-002 — Draft recovery and cancellation:** autosave a manual draft, reload and
  resume it; then cancel another draft and verify it created no version.
- **MV-003 — AI version:** submit concrete instructions; verify same document ID,
  generation state in history, and successful AI output as a distinct vN+1 in
  review with the selected source-version link.
- **MV-004 — AI failure/retry:** cause or observe a generation failure; verify no
  version appears and source version/current selection remain intact; retry and
  verify instructions/source snapshot are retained.
- **MV-005 — Review guard:** have a version author attempt to approve/reject via
  UI and REST; verify denial; use another authorized case collaborator and verify
  a decision can be recorded.
- **MV-006 — Responsive/keyboard:** operate both dialogs and the history with
  keyboard at desktop and narrow viewport; ensure focus, required fields, and
  status feedback remain usable without horizontal overflow.

## Evidence targets

- Focused Vitest output for core, validation, server controller, AI tool/workflow,
  and web hook/widget boundaries.
- Typecheck and Biome results for all changed workspaces/files.
- Migration output and server integration evidence if persistence schema changes.
- Playwright URL, screenshot/trace, browser console, and failed-request evidence
  for the authenticated case flow when services are available.
- Review of persisted DB state proving immutable source/new version records,
  separate draft, storage file path, generation linkage, and unchanged
  `currentVersionId`.

# Documentation alignment and revision history

## Authority alignment

- **Confluence PRD — Produção Documental v15**, sections 12.2–12.8: new AI/manual
  versions, immutable content/files, review, explicit current selection,
  case-team access, and interface actions.
- **Jira:** no ticket was found or supplied for this direct-request change.
- **Modules:** `documentation/modules.md` assigns immutable generated/manual
  versions, review/approval, current selection, and event publication to Produção
  Documental; Case Management owns its case gate and case-member authorization.
- **Architecture:** Core owns business rules and interfaces; server adapters own
  Nest/Drizzle/Storage/Inngest; web uses Core contracts through REST adapters.
- **Design:** `documentation/design.md`; existing screenshot identifies where the
  history action currently lives but does not replace the token/accessibility
  contract.
- **Tooling:** `documentation/tooling.md`; pnpm, Turborepo, Biome, Vitest,
  Drizzle, and Playwright CLI.
- **Rule Pack:** Code Conventions, Core Package, Use Case Testing, Validation
  Package, REST Layer, Controller Testing, Database Layer, AI Layer, Messaging
  Layer, Server App Layer, UI Layer, and Widget Testing.

## Revision history

- **Revision 1 — 2026-09-25:** initial contract for case-piece manual and AI
  version creation, based on the approved conversational design and the current
  canonical Produção Documental PRD.

## Implementation route

Plan-backed implementation is recommended because the delivery crosses Core,
validation, persistence/migration, REST, asynchronous AI workflow, and Web UI, and
introduces a persisted-draft lifecycle with integration and race-condition risk.
