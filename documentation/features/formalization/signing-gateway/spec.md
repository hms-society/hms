---
title: Gateway seguro de assinatura da Formalização
status: in_progress
revision: 13
source:
  type: jira-ticket
  ref: https://plataformahms.atlassian.net/browse/SCRUM-140
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/24051713
rfc: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/24215554
jira_tickets:
  - SCRUM-144
  - SCRUM-140
  - SCRUM-128
scope:
  - .
  - packages/core/src/formalization
  - packages/core/src/communication
  - packages/core/src/shared
  - packages/validation/src/formalization
  - apps/server/src/formalization
  - apps/server/src/communication
  - apps/server/src/identity
  - apps/server/src/shared/communication
  - apps/server/src/shared/database/drizzle
  - apps/server/src/shared/messaging
  - apps/server/src/shared/provision
  - apps/server/rest-client/formalization
  - apps/web/src/routes/assinaturas
  - apps/web/src/routes/login
  - apps/web/src/rest
  - apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration
  - apps/web/src/ui/formalization/widgets/pages/signing-gateway-page
  - apps/web/tests/routes/formalization/signing-gateway.test.tsx
  - docker-compose.yaml
  - scripts/generate-documenso-certificate.mjs
  - .gitignore
  - .dockerignore
  - package.json
  - .env.example
  - apps/server/.env.example
  - apps/web/.env.example
  - documentation/architecture.md
  - documentation/infrastructure.md
  - documentation/modules.md
  - documentation/features/formalization/signing-gateway
  - documentation/features/formalization/formalization-signature-flow
last_updated_at: 2026-09-07
---

# 1. Context and scope

## Objective

Deliver the complete Formalization signing lifecycle covered jointly by SCRUM-140 and
SCRUM-144. From the existing `ready_for_sending` configuration, the associated lawyer
reviews the immutable documents, signatories, assignments, the single consented e-mail
and message, confirms the send once, and HMS idempotently creates the signature request,
one multi-document provider envelope for the complete request, immutable request-document
snapshots, one package recipient and invitation per signatory, encrypted provider
resources and seven-day opaque HMS invitations. Communication alone delivers those
invitations, and the lawyer may cancel the still-open package send with partial-failure
recovery and preserved history.

The recipient then uses the HMS-owned, fail-closed Gateway. A natural-person client authenticates through a currently
consented e-mail channel and a one-time six-digit code. An assigned,
eligible HMS collaborator authenticates through the existing HMS session. Only after
authentication may either actor read every immutable PDF in the request through
separate HMS tabs, explicitly acknowledge each document and enter a session-bound,
HMS-origin Gateway once to the private self-hosted Documenso multi-document recipient
UI.

The delivery distinguishes a provider-observed submission from authoritative
confirmation. HMS reconciles webhook and API state, preserves every signed PDF plus
request evidence/certificate and recipient protocols in private HMS storage, updates the Formalization
state and invalidates all signing access. The result view is read-only and cannot
reopen either the document or the provider.

## Authoritative sources

| Priority | Source | Use in this contract |
| --- | --- | --- |
| 1 | Direct decisions recorded on 2026-09-03 | Use one Documenso multi-document envelope per HMS request; one invitation per signatory/request; show every package document in HMS tabs; require a separate persisted acknowledgement for every document; enter Documenso once; accept that every envelope recipient can view every envelope item; preserve one signed PDF per request document. |
| 2 | Direct decisions recorded on 2026-09-01 | Suspend the sibling SDD, make this revision the sole active SCRUM-140/SCRUM-144 contract, allow exactly one delivery/authentication channel (`email`) through Resend, and use `signatureStatus` as the canonical Formalization projection. |
| 3 | Jira [SCRUM-140](https://plataformahms.atlassian.net/browse/SCRUM-140) | Defines internal configuration completion, immutable request/envelope creation, invitation delivery and cancellation. Its one-envelope-per-document detail is superseded by the 2026-09-03 direct decision. |
| 4 | Jira [SCRUM-144](https://plataformahms.atlassian.net/browse/SCRUM-144) | Defines the recipient Gateway from invitation opening through authoritative confirmation. Its single-document session detail is superseded by the 2026-09-03 direct decision. |
| 5 | [Formalization PRD](https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/24051713) | Defines actors, consent, per-document assignment/progress, Formalization behavior and product outcomes. |
| 6 | [Documenso architecture RFC](https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/24215554) | Defines provider isolation, API V2, HMS delivery/persistence, webhook processing and reconciliation. Decision D2 and the rejected package-envelope alternative are superseded by the 2026-09-03 direct decision and require follow-up RFC alignment. |
| 7 | Repository rules, architecture and implementation | Constrain boundaries and establish the checked-in `ready_for_sending` configuration as the implementation baseline. Stale provider statements are corrected in this delivery. |
| 8 | Pencil nodes listed in [design/manifest.md](design/manifest.md) | Define the approved internal send/cancel and external Gateway experience; the document-reading composition was extended by revision 6 and is unchanged by revision 8. |

## Unified SCRUM-140 and SCRUM-144 boundary

The checked-in configuration work is an accepted historical baseline, not an active
dependency:
signatories, document assignments, signature fields, private PDF previews, selected
channels and `ready_for_sending` already exist under the implemented SCRUM-140 baseline. This
revision adds the missing send boundary and carries its outputs directly into the
Gateway. The sibling `formalization-signature-flow/spec.md` revision 16 is cancelled, its
Plan is superseded and its Evaluation is retained only as historical implementation
evidence. This revision is the sole active delivery authority; the sibling must not be
resumed or planned in parallel.

`ConfirmFormalizationSignatureSendingUseCase` owns the transition from the editable
configuration to durable work. Provider calls and Communication delivery execute in
idempotent jobs after that transaction. A request is the package-level correlation
record and owns exactly one Documenso envelope. Each signatory becomes one package
recipient, immutable recipient-document rows preserve the configured assignments, and
each package recipient receives one invitation. Provider envelope IDs therefore belong
to the request; provider envelope-item IDs map to request documents in integration
storage and never enter the Formalization aggregate.

## Current repository gap

The current worktree implements the revision-5 request graph, request-document-scoped
Documenso envelopes and recipients, invitation/OTP delivery, public Gateway sessions,
private PDF reading, provider proxy, webhook/reconciliation foundations and internal
send/cancel UI. It also contains the local Documenso/PostgreSQL runtime, Mailpit/Resend
routing and the Gateway-only Web REST boundary. Those paths are the implementation
baseline for this material amendment, even where they remain untracked in the current
delivery branch.

The revision-6 gap is structural and end-to-end: recipients and provider resources are
still duplicated per request document; provisioning and cancellation run once per
document; sessions, bindings and protocols carry a request-document anchor; Documenso
receives one PDF per envelope; HMS exposes one document and one package acknowledgement;
and final item-to-document artifact reconciliation is incomplete. No immutable
recipient-document relation, provider-envelope-item mapping or per-document
acknowledgement table exists. The implemented public controller composition must also be
split into one REST action per controller as required by the REST Rule Pack while
preserving the already-correct cookie, CSRF, locale, proxy and account-claim controls.

Architecture, infrastructure and module documentation must be rechecked against the
integrated revision-6 implementation. Any remaining DocuSeal, SQLite,
provider-managed-email or direct-provider-to-hired statement is stale and must be
aligned to Documenso, separate PostgreSQL, HMS-controlled delivery, the private Gateway
and reconciled state ownership.

## Scope boundaries

| In scope | Out of scope |
| --- | --- |
| Existing signatory/assignment/field/preview configuration plus review and idempotent confirmation from `ready_for_sending` | Changing the already-approved signatory/field editor behavior except where send-state locking requires it |
| Immutable request, request-document, package-recipient, recipient-document assignment and provider-resource creation; one multi-document provider envelope per request | Re-send campaigns or individual post-send resend/tracking actions from SCRUM-128; runtime provider selection by users |
| Opaque seven-day invitation creation, Communication delivery request and cancel-all-open-sends with safe partial retry | Provider-native recipient e-mail/reminders or direct Formalization access to Communication internals |
| Opening/exchanging invitations; client OTP; collaborator HMS-session authentication | Editing Identity contacts or consent; legal-person/external-representative authentication; CPF; ICP-Brasil |
| Exactly one current-consent e-mail destination per recipient; invitation and OTP delivery through HMS Communication using Resend | WhatsApp/SMS signing delivery in this revision, multiple channels per recipient, changing contacts or consent during the flow, or automatic fallback. WhatsApp is a planned future extension requiring a new Spec revision and migration. |
| Private HMS PDF reading, revalidation and explicit acknowledgement | Editing documents, signature fields or recipient assignments after the send snapshot is frozen |
| HMS-origin content-aware proxy over private Documenso recipient UI | Paid Documenso embedding/authentication, public provider origin, provider-native recipient e-mails or a Documenso fork |
| Submission observation, verified webhooks, API reconciliation, signed artifacts, evidence and HMS protocol | Complete internal tracking/dashboard and operational recipient actions from SCRUM-128 |
| Recipient-level submitted/confirmed/rejected/cancelled/expired outcomes and aggregate Formalization projection | Confirmation of the contract, case creation or onboarding |
| Responsive, keyboard, theme, accessibility and failure-state implementation for the Gateway | Redesigning unrelated Formalization screens |

## Approved product and security decisions

- The recipient invitation contains a 256-bit random token in the URL fragment. The
  Web exchanges it in a POST body, immediately clears it with history.replaceState
  and retains only opaque HttpOnly cookies. Client exchange consumes the invitation
  immediately. Collaborator exchange may rotate a pre-authentication flow while the
  invitation remains active; exact HMS-account authentication atomically consumes it.
- Invitation tokens are stored only as SHA-256 hashes. A valid invitation lasts seven
  days unless consumed, superseded or invalidated.
- Client OTPs contain exactly six decimal digits, last 30 minutes, are one-use and
  newest-only, and are stored as HMAC-SHA-256 over challenge ID plus code with a
  server-held pepper. Plain hashes are forbidden for this low-entropy secret.
- OTP resend has a 60-second cooldown, at most five sends per invitation in a rolling
  30-minute window and at most 20 sends per source IP in 30 minutes. Five failed
  validations lock the invitation flow for 15 minutes. Responses do not reveal which
  limit, contact or invitation exists.
- Authenticated signing sessions last at most one day and require independent random
  session and device cookies. The device cookie is possession binding, not a
  fingerprint; IP address and user-agent are risk/audit signals only and never hard
  bindings.
- Submission invalidates signing privileges by converting the presenting session in place
  from `authenticated` to the read-only `result` kind and revoking every provider binding and
  other session. The existing independent session/device cookie pair remains unchanged and
  expires at its original time, never later than 24 hours. No independent result bearer or
  result cookie exists. Result authority exposes status and protocol only; it grants no PDF or
  provider access.
- Documenso is private/self-hosted and pinned to v2.17.0 at GHCR digest
  sha256:1377ba20181d4d029e768b7b7615e4e49c39450a85588a525e78dc586dd2569c.
  The Gateway uses API V2 and a content-aware proxy; no provider origin, raw signing
  URL or raw recipient token may reach the browser, Communication, public API payload,
  URL, cookie, telemetry or log.
- The proxy release gate is strict. If an automated proof finds a raw provider token
  in the address bar, DOM/response payload, network request, storage, cookie, console,
  trace or server log, the release is blocked. The requirement is never silently
  weakened to origin-only privacy.
- PDF/provider unavailability, rejection and cancellation derive from the approved
  unavailable-state pattern with state-specific copy and fail-closed actions.

## Technical decisions

| Decision | Chosen approach | Alternative considered | Reason | Accepted trade-off |
| --- | --- | --- | --- | --- |
| Active SDD authority | Cancel/supersede the implemented sibling and retain it only as historical evidence; revision 5 is the sole active contract. | Keep two concurrent Specs split at `ready_for_sending`. | Avoids overlapping ownership and lets SCRUM-140 request creation and SCRUM-144 Gateway evolve as one transactionally consistent delivery. | The larger contract requires Plan-backed execution. |
| Recipient channel cardinality | Exactly one snapshotted `deliveryChannel: 'email'` per recipient, delivered by Resend. | Multiple selected channels or immediate WhatsApp support. | Resolves persistence, consent, retry and UI semantics without inventing fallback behavior. | WhatsApp needs a future material Spec revision and database constraint migration. |
| Formalization projection | One `signatureStatus?: FormalizationSignatureRequestStatus` field for the complete request lifecycle. | A terminal-only `signatureTerminalStatus` companion. | A single monotonic projection avoids conflicting status authorities and represents in-progress as well as terminal outcomes. | Consumers must distinguish terminal states from the shared status union. |
| Provider envelope cardinality | One Documenso v2.17 multi-document envelope per HMS request, with one envelope item per request document. | One envelope per document as stated by the current RFC/Jira. | A signer receives one invitation, reviews the package in HMS tabs, enters the provider once and completes one provider ceremony. | Every recipient can view every item; an unrelated pending recipient may delay final envelope artifacts. |
| Recipient cardinality | One request recipient per signatory plus immutable recipient-document assignment rows. | One recipient per signatory/document pair. | One invitation/session/provider recipient must represent the signer across all assigned documents without an arbitrary anchor row. | Per-document status is derived through assignments and package recipient/provider state. |
| Reading acknowledgement | Persist one acknowledgement per recipient, request document and immutable snapshot before provider entry. | One package checkbox or a single-document acknowledgement/start command. | The HMS reading step proves explicit review of every document while keeping provider entry package-scoped. | Returning signers retain acknowledgements for the same immutable snapshot. |

## Revision 6 multi-document envelope amendment

This section is normative wherever revision-5 language below still names a
document-scoped envelope, recipient, invitation, session, provider binding,
provisioning attempt or cancellation attempt. Revision 6 replaces those cardinalities
with the following model:

- one `FormalizationSignatureRequest` owns one provider envelope and one provisioning
  and cancellation work item;
- one request document maps to one provider envelope item and keeps its own immutable
  PDF, field geometry, state and final signed-PDF artifact;
- one request recipient exists per signatory and maps to one provider recipient;
- immutable recipient-document assignment rows preserve who must sign which document;
- one invitation, Gateway session, proxy binding and protocol exist per request
  recipient rather than per recipient/document;
- an authenticated recipient may read every document in the request because the shared
  provider envelope necessarily exposes every item to every recipient; assignment
  controls required fields and progress, not item visibility;
- provider entry is denied until the recipient has one persisted acknowledgement for
  every request document in the immutable snapshot;
- Documenso is entered once and its native item selector presents the same document
  set; completion is one envelope-level ceremony even though required fields remain
  document-specific;
- signed PDFs are downloaded and preserved separately for every envelope item;
  provider-wide evidence/certificate and each recipient protocol remain request-scoped.

The PRD's document assignment and progress rules remain authoritative. Shared-envelope
visibility and delayed final artifact availability are explicit accepted trade-offs.
The canonical RFC and Jira descriptions still state one envelope per document; their
packaging clauses are stale. The Orchestrator owns G-06. Revision 12 records the
user's explicit decision to defer that external alignment and accept the mismatch as
a non-blocking delivery risk. The delivery must not claim that Jira or Confluence was
updated or aligned.

## Revision 7 atomic provider-observation amendment

The request-scoped envelope can contain multiple recipients and items, so reconciliation
must never apply one recipient observation at a time while reusing the same request or
Formalization optimistic version. `SignatureProvider.findEnvelopeState` returns one coherent,
authoritative envelope snapshot containing the single normalized envelope status and every
recipient/item observation. `recordProviderObservationAndDerive` accepts that complete batch
and commits every receipt update, recipient transition, item-derived document transition,
request transition and Formalization projection in one compare-and-swap transaction. Receipt
updates are an independent `0..n` collection: scheduled reconciliation supplies none, while a
webhook hint supplies its actual receipt without fabricating one per provider recipient.
Already-applied receipt updates are skipped individually and never suppress newer provider
state in the same batch. A conflict rejects the complete batch for retry; no recipient or
projection is advanced independently. A webhook-derived single-recipient hint is represented
as a one-element recipient batch with one receipt update and remains non-authoritative until
reconciliation obtains the complete provider state.

## Revision 8 webhook-receipt identity and lease amendment

Webhook processing receives the generated receipt primary key, not its external dedupe key.
The focused Gateway transaction therefore claims by `receiptId` in one compare-and-swap
operation and persists a unique per-attempt claim token plus expiry; repositories retain only
the Rule-approved query and `add`/`replace` vocabulary. A claimed receipt may be finalized or
failed only by the exact unexpired claim token, so a stale invocation cannot finalize a later
reclaim even when both runs execute on the same logical worker. An already-processed receipt
remains readable so a replayed safe hint can still advance newer monotonic provider state
without rewriting that receipt. Missing, busy or malformed/decryption-failed receipts return
`retry_required`; they never publish a reconciliation event using the receipt ID as if it were
a signature request ID. A safe parsed hint supplies the real request ID for reconciliation
publication. The observation transaction checks `expectedClaimToken` for every non-processed
receipt update, skips an already-processed receipt independently and still applies newer graph
state atomically. The Inngest job converts `retry_required` to a retriable failure; after its
bounded retries, the failed receipt remains auditable and the existing periodic request-level
reconciliation independently recovers provider truth without trusting the receipt payload.

## Revision 9 reconciliation-only webhook amendment

Revision 8 can owner-check a receipt while applying an observation or failing a claim, but
it cannot finish a valid reconciliation-only/unknown event without fabricating graph changes
or leaving the claim to expire. The focused transaction therefore adds
`completeWebhookReceiptClaim`, which marks only the receipt processed when the exact fresh,
unexpired claim token still owns it. The encrypted receipt payload is a strict
provider-neutral discriminated hint produced by the Server Documenso adapter before
`ReceiveSignatureProviderWebhookUseCase`: `observation` carries the normalized one-recipient
scheduling hint, while `reconciliation_only` carries only the trusted HMS request ID.
Documenso event-name constants and raw payload interpretation remain in the Server adapter,
never in Core. A reconciliation-only hint finalizes its claimed receipt, publishes one
request-level reconciliation event and returns `reconciliation_requested` without calling
`recordProviderObservationAndDerive`; an already-processed replay may republish the same safe
request reconciliation without rewriting the receipt. Missing request identity, malformed
discriminators or invalid enum/count/version values fail the exact owned claim and return
`retry_required` without publication.

## Revision 10 provider-entry, submission and aggregate-derivation amendment

A proxy alias is a one-time bearer secret whose plaintext is never persisted, so a successful
binding commit followed by a lost HTTP response cannot be recovered by returning the original
alias. Provider entry is therefore one focused transaction with two modes. The first entry
locks the active authenticated session, request, recipient and active binding set, inserts the
single prepared binding and advances the recipient from `reading` to `signing`. A retry for the
same still-valid session/request/recipient must find exactly one matching active binding,
generate a fresh alias, atomically replace its alias hash and invalidate the previous alias.
Zero bindings in retry mode, multiple bindings, a foreign session/request binding, stale
versions or terminal state fail closed. The encrypted provider credential is reused and never
returned. `GetSignatureGatewayContextUseCase` performs no proxy-alias rotation on GET. It does
rotate the synchronizer CSRF value under the session optimistic version and returns its
plaintext once in the context response so an in-memory Web store can recover after refresh.
While a recipient is `signing`, context returns the fully acknowledged `reading` recovery
state, and the explicit CSRF-protected start action rotates the alias and returns the transient
proxy path.

Provider submission must also survive a committed transaction followed by a lost HTTP
response. Minting a replacement result token cannot satisfy that rule because only its hash
would persist and the browser would retain a revoked authenticated cookie. The transaction
therefore converts the exact presenting authenticated session in place to `kind: 'result'`,
preserving its already-hashed token/device/CSRF values and expiry while removing its signing
privileges. It locks the request, recipient, Formalization and every active
invitation/session/binding for that recipient; records the normalized HMS
`providerObservationId`; monotonically advances the recipient; revokes every other signing
session and every binding; consumes invitations; and derives request/Formalization status from
the complete locked recipient graph. No new plaintext result or CSRF secret exists, no caller
supplies aggregate status, Formalization identity or optimistic version, and a conflict returns
no successful response. After either a normal or lost response, the browser's existing opaque
cookie resolves only the read-only result context.

Finally, partial webhook hints never dictate aggregate projections. Any terminal envelope,
recipient or item value in a one-recipient hint completes only the owned receipt and schedules
authoritative request reconciliation. Non-terminal partial hints and complete authoritative
envelope observations call `recordProviderObservationAndDerive`; that transaction locks the
current request, Formalization, recipient and request-document graph and derives every
aggregate transition itself. Caller-supplied hard-coded request/Formalization changes are not
part of the port. Acknowledgement also rechecks session expiry and, for collaborators, the
exact source person, permitted current role and current request assignment at mutation time.

## Delivery gates and Spec status

The contract is implemented and eligible for conclusion under the explicit revision-12
risk waiver below. The waiver changes delivery evidence requirements; it does not weaken
the runtime security, privacy, authorization, state-machine or data-integrity behavior
defined by this Contract.

### Revision 12 conclusion risk waiver

On 2026-09-07, the user explicitly selected accepted-risk conclusion. For this delivery:

- MV-01 through MV-08, the remaining visual comparisons, and G-01, G-02, G-05 and G-06
  are deferred and are not preconditions for conclusion;
- those items must be recorded as `waived`, never `passed`, and their missing evidence
  remains an accepted deployment, security, legal, operational or documentation risk;
- FND-047, FND-049, FND-050 and FND-052 are accepted without fresh integrated closure
  evidence; this is not a technical resolution of those findings;
- the previously requested independent implementation reviewer is waived for this
  feature delivery;
- G-04 remains an implementation invariant, while the repository-wide structural path
  check and pull-request CI remain mandatory because they are SDD controls outside this
  feature Contract.

This waiver permits conclusion of the checked-in implementation. It does not authorize
public/staging/production activation, assert legal approval, certify the provider setup,
or claim that an unexecuted validation passed.

| Gate | Classification | Exit evidence |
| --- | --- | --- |
| G-01 AGPL/network-use review | Accepted risk; non-blocking for revision-12 conclusion | Deferred. No legal/organizational approval is claimed and this waiver does not authorize public proxy exposure. |
| G-02 staging signing certificate | Accepted risk; non-blocking for revision-12 conclusion | Deferred. No staging certificate or real-provider release acceptance is claimed. |
| G-04 provider pin | Implementation and release invariant | Deployment and lock/config use v2.17.0 at the approved digest; an automated check rejects tag-only or changed-digest configuration. |
| G-05 same-origin ingress | Accepted risk; non-blocking for revision-12 conclusion | Deferred. Shared-environment ingress activation is not validated or authorized by this waiver. |
| G-06 Jira/RFC authority alignment | Accepted documentation mismatch; non-blocking for revision-12 conclusion | Deferred by explicit user decision. Jira/Confluence remain unchanged and must not be represented as aligned. |

# 2. Implementation Contract

## Functional requirements

| ID | Required behavior |
| --- | --- |
| RF-01 | POST exchange accepts an invitation token only in the JSON body, hashes it before lookup and sets a non-identifying flow cookie. Client exchange consumes it atomically once. Collaborator exchange keeps it active and rotates any previous flow so login, account switching or refresh can recover; exact assigned-account authentication atomically consumes it while rotating into the authenticated session. A pre-revision consumed collaborator invitation remains recoverable only while its recipient is still `invited` or `authenticating`. The token is never accepted from a query string, path, header or log. |
| RF-02 | Before authentication, all public responses are generic and reveal no recipient name, document title, Formalization ID, contact value, actor existence or terminal reason. |
| RF-03 | Each client recipient has exactly one supported delivery/authentication channel: `email`. Identity must expose one current e-mail with active `email_communication` consent, rendered only as a masked confirmation. Zero eligible e-mails fails closed; multiple transport choices and WhatsApp fallback are forbidden. |
| RF-04 | OTP issue rereads the selected destination and consent, applies all invitation/IP cooldown and rolling-window limits atomically, invalidates the prior challenge, stores only the HMAC verifier and emits one encrypted, redacted delivery command to Communication. |
| RF-05 | OTP verification compares in constant time, accepts only the newest active challenge once, increments failed attempts atomically and creates a 15-minute lock at the fifth failure. Success consumes all open challenges and rotates into an authenticated session. |
| RF-06 | A collaborator never sees channel or OTP steps. Gateway access requires an existing HMS session for the exact recipient person, an active collaborator and current Lawyer, Paralegal or Supervisor profile, plus current assignment to the request. A different current HMS account preserves the pre-authentication flow and renders an explicit account-switch action instead of consuming or invalidating access. |
| RF-07 | Login return supports only a server-generated, signed or strict relative allow-listed Gateway return target. Authentication success returns to that path; external origins and arbitrary paths fall back to the HMS home page. |
| RF-08 | Every authenticated read and mutation revalidates session expiry plus invitation/request/recipient state. Collaborator eligibility is bound to the exact session recipient person; permitted current role and current request assignment are revalidated on session creation, document access, each acknowledgement, provider entry and immediately before any provider signing mutation. |
| RF-09 | Every complete immutable request PDF is listed in authoritative order and streams by caller-selected request-document ID only from private HMS storage after authentication, with no-store/no-cache headers, attachment-safe metadata and no provider credential. The ID must belong to the session request; range requests may be supported without making the object public. |
| RF-10 | The reading session lasts at most 24 hours and is bound to recipient, request, immutable package snapshot and device-secret hash, not to one document. Another browser or replaced device cookie cannot reuse it. |
| RF-11 | Entering signing requires a separate explicit acknowledgement for every request document, recorded once per recipient/document/snapshot with time, session and audit context. Each acknowledgement rechecks active unexpired session authority and exact collaborator person/role/assignment when applicable. A missing acknowledgement, stale snapshot or failed revalidation denies provider entry. |
| RF-12 | Documenso remains reachable only on the private service network. HMS creates a random proxy alias mapped server-side to the encrypted raw provider recipient token and routes the recipient UI through the HMS origin. First entry atomically creates the sole active package binding and advances the recipient to signing; a refresh/lost-response retry atomically rotates that binding's alias hash and invalidates the old alias without persisting or recovering alias plaintext. |
| RF-13 | The content-aware proxy rewrites both directions across request URL/body and response Location, Link, HTML, JSON, JavaScript/bootstrap payload and provider cookie paths. It replaces provider origins and raw tokens, strips unsafe headers, applies a restrictive CSP and fails closed for an unclassified signing mutation or unsafe textual response. |
| RF-14 | Provider-native recipient e-mail/reminders are disabled. Every Documenso recipient uses a unique non-deliverable technical alias of the form `signer-{random}@signing.invalid`; real recipient e-mails never enter Documenso. HMS Communication is the sole delivery authority and its only production adapter for this flow is Resend. |
| RF-15 | A successful provider signing mutation records the normalized HMS observation ID and submitted time, revokes every active proxy binding and every other authenticated signing session, consumes every active invitation and atomically converts the exact presenting session in place to a read-only `result` receipt while preserving only its already-hashed token/device/CSRF values and expiry. Aggregate request/Formalization status is derived from the complete locked recipient graph. A transaction conflict returns no success; duplicate delivery is idempotent. After a lost response the existing opaque cookie resolves only the pending-confirmation result and cannot reopen PDF/provider content. Supported completion events converge through webhook processing/reconciliation. |
| RF-16 | The public webhook verifies X-Documenso-Secret with a length-safe constant-time comparison over the raw configured value, size-limits and validates the payload, persists a deduplicated receipt and responds within ten seconds before asynchronous processing. |
| RF-17 | Webhook processing claims the generated receipt primary key under one bounded claim generation identified by a fresh internal `IdProvider` token. The Server Documenso adapter maps v2.17.0 DOCUMENT_OPENED, DOCUMENT_SIGNED, DOCUMENT_RECIPIENT_COMPLETED, DOCUMENT_COMPLETED, DOCUMENT_REJECTED, DOCUMENT_CANCELLED and RECIPIENT_EXPIRED into a strict provider-neutral encrypted observation hint before persistence; unknown valid events become reconciliation-only hints with a trusted HMS request ID. A stale, different or expired claim token cannot finalize the receipt, including when both attempts run on the same logical worker. Reconciliation-only events and any partial hint containing a terminal envelope, recipient or item value finalize only their receipt and trigger authoritative reconciliation without speculative graph or aggregate changes; missing, busy, malformed or undecryptable receipts retry without treating the receipt ID as a signature request ID. |
| RF-18 | Webhook data is evidence, not sole authority. Processing and scheduled reconciliation call the Documenso API V2 through SignatureProvider, compare envelope/recipient state and use monotonic, idempotent HMS transitions. |
| RF-19 | HMS obtains one coherent authoritative envelope/recipient/item observation and reconciles it as one optimistic transaction. Zero or more real webhook receipt updates remain independently idempotent and never suppress newer provider state. The transaction locks the current request, Formalization, recipient and request-document graph and owns aggregate derivation; callers cannot supply hard-coded request/Formalization projections. HMS then preserves one signed PDF exactly once per completed envelope item/request document, plus provider-wide evidence/certificate once per request when available. It confirms the package recipients and their immutable request-scoped protocols only after the shared envelope is authoritative and all required artifacts are durable. A request document becomes confirmed only after every assigned recipient is confirmed and its signed PDF is preserved; the package/Formalization becomes confirmed only after every required request document is confirmed. |
| RF-20 | Artifact download, validation, storage and confirmation form one recoverable workflow. Partial failure records reconciliation_required and retries; it never advances Formalization to confirmed or loses the last known provider outcome. |
| RF-21 | Rejected, cancelled and expired are terminal and revoke invitation, OTP, session, result signing privileges and proxy bindings. They never create confirmation artifacts or a confirmed projection. |
| RF-22 | Aggregate request state derives inside the focused database transaction from the complete locked recipient/document graph and provider truth. Submission, partial non-terminal observations, authoritative reconciliation and confirmation update the Formalization projection idempotently; no use case or adapter passes an independently guessed aggregate status. Downstream contract/case transitions remain outside this Spec. |
| RF-23 | A result receipt exposes only submitted, confirmed, rejected, cancelled, expired or reconciliation-pending status, safe timestamps and protocol when available. It expires no later than 24 hours and can be explicitly closed/revoked. |
| RF-24 | Audit records cover exchange, channel selection, OTP issue/verify/lock, collaborator authentication, PDF access, acknowledgement, proxy entry/mutation/submission, webhook receipt/processing, reconciliation, artifacts, terminal transition and revocation without sensitive values. |
| RF-25 | All public commands use synchronizer CSRF tokens held in memory by the Web client and sent in X-HMS-Signing-CSRF, plus exact Origin validation and JSON content type. Invitation exchange is the bootstrap exception and still enforces exact Origin and JSON. |
| RF-26 | The route is usable at 390×844, 200% zoom, keyboard-only and with screen readers. OTP visually separated digits remain one labeled input; status changes use restrained live regions; focus moves to the next meaningful heading after each transition. |
| RF-27 | Provider/PDF downtime, invalid/expired access, no channel, OTP error/lock, lost collaborator eligibility, rejection, cancellation and reconciliation delay render approved fail-closed states with no document leakage. |
| RF-28 | Architecture and infrastructure documentation are updated in the same implementation to remove DocuSeal/SQLite/direct-provider-email/direct-hired-state contradictions. |
| RF-29 | Only the associated lawyer or an authorized administrator may open the send review for a non-terminal Formalization whose package is confirmed and whose signature configuration is exactly `ready_for_sending`; the server rereads every source and never trusts browser-supplied person, contact, consent, file or field snapshots. |
| RF-30 | The review shows the authoritative immutable PDFs, signatories, document assignments, one masked consented e-mail per signatory and the non-sensitive message preview. CPF is absent. A historical configuration that selects only WhatsApp is not send-ready for this delivery. Missing/revoked e-mail consent, missing preview bytes, stale versions, unassigned documents or invalid fields block confirmation fail closed. |
| RF-31 | Confirming once atomically freezes the configuration and adds one immutable Formalization/signature-configuration snapshot, one package-level request linked to it, one request document per ready PDF, one recipient per signatory, one immutable recipient-document assignment per configured relation and one request-level provisioning attempt. The same idempotency key or a concurrent retry returns the same request and never duplicates rows. |
| RF-32 | After commit, one durable request provisioning job creates exactly one Documenso V2 multi-document envelope with every request PDF, one provider recipient per package recipient and fields addressed to their envelope items, disables provider e-mail/reminders, distributes it and stores the envelope, envelope-item and recipient mappings plus encrypted recipient credentials. A timeout after provider creation enters reconciliation instead of creating another envelope. |
| RF-33 | Each successfully provisioned package recipient receives one active seven-day HMS invitation for the complete request; its 256-bit raw token is returned only to the delivery boundary and only its SHA-256 hash is persisted. The recipient snapshots exactly one `deliveryChannel: 'email'`; arrays or alternate channels are not part of the request contract. |
| RF-34 | Formalization persists one encrypted bounded invitation send attempt and publishes one versioned invitation-ready event per package recipient after commit. Communication revalidates the e-mail and `email_communication` consent, sends only the HMS fragment URL through Resend, persists its own message/delivery record and reports a redacted outcome. OTP delivery uses the same Resend boundary. A reconciler republishes only pending/due attempts with the same invitation/token. No raw Documenso URL/token or confidential document detail crosses the event. |
| RF-35 | Provisioning and delivery progress is explicit and recoverable: `pending`, `processing`, `provisioned`, `delivery_pending`, `sent`, `reconciliation_required`, `failed` or terminal. Partial success is preserved and retries resume only unfinished idempotent steps. |
| RF-36 | Before any provider request exists, `Cancelar configuração` returns the configuration to its allowed pre-send state without fabricating cancellation records. After an open request exists, only `Cancelar todos os envios` is available and editing remains locked until the shared provider envelope is terminal or safely reconciled. |
| RF-37 | Cancel-all records the actor and time, revokes every applicable invitation/session/binding immediately, and schedules one idempotent provider cancellation attempt for the request envelope. Signed/confirmed documents, artifacts, evidence and audit history are never removed; provider failures remain retryable and visible. |
| RF-38 | Request, request-document and recipient states project monotonically onto the Formalization fields `signatureRequestId`, canonical `signatureStatus`, `signatureSubmittedAt`, `signatureConfirmedAt` and `signatureTerminalAt`. `signatureStatus` uses `FormalizationSignatureRequestStatus` for every non-terminal and terminal request state; no parallel `signatureTerminalStatus` field exists. The package-level request derives its state from all request documents/recipients and never directly confirms hiring or opens a Case. |

## Acceptance criteria and required evidence

| ID | RF coverage | Given / when / then | Automated evidence |
| --- | --- | --- | --- |
| CA-01 | RF-01, RF-02, RF-25 | Given valid, invalid, expired and raced tokens, when exchange runs, then a client token creates only one flow while a collaborator token rotates to one current pre-authentication flow until exact account authentication consumes it; every response/log is non-enumerating and the browser URL is immediately clean. | Core, transaction-adapter, controller and route tests; browser trace inspection. |
| CA-02 | RF-03, RF-04 | Given e-mail, WhatsApp and revoked Identity consents, when authentication context loads or an OTP is requested, then exactly one live consented masked e-mail is usable; WhatsApp is never offered and changed e-mail consent fails closed. | Identity projection, use-case, controller and widget tests. |
| CA-03 | RF-04, RF-05 | Given resend and verify races across instances, when limits and expiry are exercised, then newest-only, 30-minute expiry, 60-second cooldown, 5/30m invitation, 20/30m IP and 5-attempt/15m lock hold without plaintext code persistence. | Core fake-clock tests, PostgreSQL concurrency tests and log scan. |
| CA-04 | RF-06, RF-07, RF-08 | Given exact, different, inactive, ineligible and unassigned collaborators, including sequential signers in one browser, when login/return and protected actions run, then only the exact currently eligible assignee continues, a different current account receives a recoverable account-switch state, and the return target cannot leave the allow-list. | Auth middleware/action, controller and real authenticated Playwright tests. |
| CA-05 | RF-09, RF-10 | Given valid/expired/different-device sessions and valid/foreign document IDs, when metadata, PDF bytes and ranges are requested, then the bound package session can read every document in its request and no other document, with no-store headers and no public storage URL. | Controller/storage tests and real browser network assertions. |
| CA-06 | RF-08, RF-11, RF-12 | Given multiple package documents, an expired session, collaborator person/role/assignment drift, snapshot/request changes or a lost provider-entry response, when each `Li este documento` action and final Continue run, then acknowledgements persist independently only under current authority, missing/stale authority fails closed, first entry creates one binding atomically and retry rotates only its alias hash so the old alias is invalid and the signer can continue. | Core concurrency plus real-PostgreSQL transaction/controller, hook and widget tests. |
| CA-07 | RF-12, RF-13 | Given the pinned normal recipient UI and every redirect/loader/action/error path, when proxied, then all functionality needed to sign works under the HMS origin and no raw origin/token appears anywhere client-observable. | Provider contract suite, browser trace/DOM/storage/log scanner; release-blocking MV-05. |
| CA-08 | RF-14 | Given an e-mail-eligible recipient, when envelopes distribute and sign, then provider e-mail/reminders remain disabled, the Documenso alias is unique/non-deliverable, the real e-mail is absent from Documenso and HMS delivery succeeds through Resend. | Resend adapter tests, provider audit and staging E2E. |
| CA-09 | RF-15, RF-22, RF-23 | Given a successful signing mutation, duplicate delivery or committed transaction followed by a lost HTTP response, when submission is recorded, then the presenting session is atomically downgraded in place to result-only, every other signing access row is revoked, the normalized observation is recorded and request/Formalization state is transaction-derived; refresh with the unchanged opaque cookie reaches only the read receipt and cannot fetch PDF/provider content. | Core plus real-PostgreSQL transaction/controller, proxy, session repository and route tests. |
| CA-10 | RF-16 | Given missing, wrong-length, wrong-value, duplicate, oversized and valid webhook requests, when received, then only valid requests persist once, all comparisons are safe and acknowledgement remains under ten seconds. | Controller raw-request and database tests. |
| CA-11 | RF-17, RF-18 | Given duplicate, reordered, unknown, lost or partial terminal webhooks, when workers and scheduled reconciliation run, then terminal partial hints update only their owned receipt and schedule authoritative API reconciliation, while safe non-terminal hints converge monotonically without duplicate effects. | Job, fake-provider, API-adapter and PostgreSQL idempotency tests. |
| CA-12 | RF-19, RF-20, RF-22 | Given a coherent multi-recipient, multi-document envelope snapshot with zero or more independently idempotent receipt updates, duplicate/out-of-order observations, a late recipient/document/request/Formalization conflict, or per-item download/storage/hash failures, when webhook processing or reconciliation retries, then the transaction derives aggregate request/Formalization state from its complete locked graph, the applicable provider-observation batch is applied atomically with no partial row/projection advance and confirmation occurs exactly once only after every signed item PDF, request-level evidence and recipient protocol persist. | Multi-recipient Core plus real-PostgreSQL webhook/reconciliation rollback tests and worker/storage fault injection. |
| CA-13 | RF-21, RF-22 | Given recipient rejection/cancellation/expiry and multi-recipient requests, when outcomes reconcile, then terminal access revokes and aggregate/Formalization projections follow the defined policy without contract/case side effects. | Core state-table and projection tests. |
| CA-14 | RF-24, RF-25 | Given malicious inputs and normal flows, when logs/audit/delivery-ledger/telemetry are inspected, then required actions are traceable and contain no invitation, OTP, cookie, CSRF, raw provider token, signed URL or artifact bytes. | Redaction tests and repository-wide secret canary scan. |
| CA-15 | RF-26, RF-27 | Given desktop/narrow, keyboard, 200% zoom and reduced-motion contexts, when happy and fail-closed flows run, then content remains operable, focused, announced and visually aligned to the manifest. | Widget/route tests, axe where configured and Playwright evidence. |
| CA-16 | RF-28 | Given repository source-of-truth documents, when implementation concludes, then architecture, infrastructure and modules describe the same provider, data store, delivery boundary and state ownership as code. | Documentation review and path/link validation. |
| CA-17 | RF-29, RF-30 | Given ready, stale, unauthorized, unconsented and incomplete configurations, when review/confirmation is requested, then only the associated authorized actor sees authoritative data and only the still-ready version can proceed without CPF or browser-authored snapshots. | Existing configuration regressions; new Core/controller/widget tests; authenticated Playwright. |
| CA-18 | RF-31, RF-38 | Given duplicate HTTP calls and concurrent confirmation, when the send transaction runs, then exactly one request, one recipient per signatory, the expected document/assignment rows and one provisioning row exist, the configuration is locked and projections retain their versioned monotonic state. | Core use-case and real-PostgreSQL transaction/controller tests. |
| CA-19 | RF-32, RF-35 | Given multi-document/multi-recipient fields, provider timeout-after-create and retry, when provisioning runs, then the request has one envelope, each document has one item mapping, each signatory has one recipient/credential mapping and only unfinished work is reconciled. | Fake/Documenso contract suites and real Inngest job tests. |
| CA-20 | RF-33, RF-34 | Given e-mail-eligible, WhatsApp-only and revoked-consent signatories, when provisioning completes, then each e-mail-eligible recipient snapshots exactly `deliveryChannel: 'email'` and produces one hashed seven-day invitation and one Resend-backed Communication command without provider secrets; WhatsApp-only or revoked consent fails closed without fallback. | Core/event/job/controller tests, local e-mail fixture/Resend evidence and secret canary scan. |
| CA-21 | RF-36, RF-37 | Given no request, an open package, partly submitted recipients and cancellation failure, when either cancellation action runs, then the correct action is exposed, open access is revoked immediately, completed evidence remains and retry converges without duplicate envelope cancellation. | Core, transaction, provider/job and widget/dialog tests. |
| CA-22 | RF-29–RF-37 | Given the approved Pencil states at desktop, narrow viewport, keyboard, 200% zoom and both themes, when the internal review/send/cancel flow runs, then its tabs, dialog summaries, pending state and recovery actions remain operable and match the manifest. | Widget/route tests and real authenticated Playwright visual/accessibility evidence. |

# 3. Technical Contract

## State and policy model

## Recipient and request states

HMS state is independent from provider labels. Adapters translate provider observations
into these monotonic states.

| HMS recipient state | Allowed successors | Meaning |
| --- | --- | --- |
| invited | authenticating, authenticated, cancelled, expired | Existing invitation can begin. |
| authenticating | authenticated, locked, cancelled, expired | Client flow or collaborator return is active. |
| locked | authenticating, cancelled, expired | OTP attempts are temporarily blocked; unlock is time-derived. |
| authenticated | reading, cancelled, expired | Bound session exists. |
| reading | signing, cancelled, expired | HMS PDF is readable; provider is not yet exposed. |
| signing | submitted, rejected, cancelled, expired | Active proxy binding exists. |
| submitted | confirmed, rejected, cancelled, reconciliation_required | HMS observed provider submission; access is revoked. |
| reconciliation_required | submitted, confirmed, rejected, cancelled | A recoverable authority/artifact step failed. |
| confirmed | none | Provider completion and all HMS evidence are durable. |
| rejected | none | Recipient/provider rejection is authoritative. |
| cancelled | none | HMS cancel-all or provider cancellation is authoritative. |
| expired | none | Invitation/recipient expiry is authoritative. |

Request state is a projection: sent before activity; in_progress after any opening or
authentication; partially_submitted when at least one but not every required recipient
submitted; submitted when every required recipient submitted but durable confirmation
is incomplete; confirmed only when every required recipient is confirmed and every
request document has required artifacts; rejected or cancelled when the authoritative
request policy says the envelope cannot complete; reconciliation_required when
provider truth is terminal but HMS preservation/projection is incomplete. No state in
this feature means contract confirmed or client hired.

## Invariants

- A request, recipient and invitation belong to the same Formalization snapshot.
- At most one active invitation generation exists per recipient; at most one active
  OTP challenge exists per invitation; at most one active authenticated signing
  session and provider binding exists per recipient/device.
- Consuming an invitation token, rotating flow cookies, issuing/verifying OTP,
  revoking sessions and applying provider observations are compare-and-swap or
  row-locked transactions.
- State transitions are monotonic. Reordered observations may enrich audit evidence
  but cannot move a recipient from a terminal state back to an active state.
- Client channel consent is live authorization, not only a send-time snapshot.
- Collaborator HMS authentication proves account possession but not assignment or
  eligibility; both are reread.
- Unsigned and signed files remain private HMS files. Database rows contain stable file
  references and hashes, never provider public URLs.
- The provider raw token is encrypted at rest with key-version metadata and decrypted
  only inside the private provider adapter/proxy request boundary.
- No application error includes a secret, provider body or contact value by default.

## Failure policy

| Condition | Public behavior | Internal behavior |
| --- | --- | --- |
| Invalid, expired, superseded or terminal invitation | Generic unavailable state | Record redacted reason when an invitation row is known; no state mutation for unknown tokens. |
| No current consented client channel | No-authorized-channel state | Audit consent projection version/time; do not infer fallback. |
| Invalid/superseded/used OTP | Generic invalid-or-expired message | Increment only the active challenge under lock; never reveal which predicate failed. |
| OTP locked/rate limited | Locked state with safe retry time when the flow is known | Store lock/counter atomically; no delivery event. |
| Lost collaborator eligibility/assignment | Generic unavailable state and revoke | Record exact internal reason, expire session/binding. |
| PDF missing/unavailable | Derived unavailable state with safe retry | Do not call provider; alert and retry storage resolution. |
| Provider unavailable before submission | Derived temporary-unavailable state | Keep authenticated session if still valid, revoke broken binding and allow a new binding after revalidation. |
| Provider failure after possible submission | Confirmation-pending state | Revoke signing access and reconcile; never invite a duplicate signature attempt until authority is known. |
| Rejected/cancelled/expired | Derived terminal unavailable/result state | Revoke all access and converge request/Formalization projection. |
| Completed provider state but missing artifact | Confirmation-pending/reconciliation state | Persist reconciliation_required and retry with alerting; never claim confirmed. |

## Core, validation and integration contracts

## Core types and aggregates

Extend the Formalization bounded module; do not create a new top-level business module.
Gateway authentication is part of Formalization because it authorizes access to a
Formalization signature request. Communication and Identity retain their own data and
are reached only through purpose-built projections/events or shared provider
contracts.

The declarations below are the canonical Core contract. Each exported declaration is
implemented in its own kebab-case file and re-exported through the nearest barrel.
Entities follow `Entity & { ... }`; structures are plain types. Hashes, MACs and
ciphertext are opaque strings at this boundary, never Node `Buffer` values or runtime
value-object classes. Upstream SCRUM-140 request/document/recipient/invitation types are
extended additively if their checked-in names differ; no parallel aggregate is created.

```ts
export const FormalizationSignatureRecipientKind = {
  client: 'client', collaborator: 'collaborator',
} as const
export type FormalizationSignatureRecipientKind = ValueOf<
  typeof FormalizationSignatureRecipientKind
>

export const FormalizationSignatureChannelKind = {
  email: 'email',
} as const
export type FormalizationSignatureChannelKind = ValueOf<
  typeof FormalizationSignatureChannelKind
>

export const FormalizationSignatureInvitationStatus = {
  active: 'active', consumed: 'consumed', revoked: 'revoked', expired: 'expired',
} as const
export type FormalizationSignatureInvitationStatus = ValueOf<
  typeof FormalizationSignatureInvitationStatus
>

export const FormalizationSignatureOtpChallengeStatus = {
  pendingDelivery: 'pending_delivery', active: 'active', consumed: 'consumed',
  superseded: 'superseded', expired: 'expired', deliveryFailed: 'delivery_failed',
} as const
export type FormalizationSignatureOtpChallengeStatus = ValueOf<
  typeof FormalizationSignatureOtpChallengeStatus
>

export const FormalizationSignatureGatewaySessionKind = {
  flow: 'flow', authenticated: 'authenticated', result: 'result',
} as const
export type FormalizationSignatureGatewaySessionKind = ValueOf<
  typeof FormalizationSignatureGatewaySessionKind
>

export const FormalizationSignatureAccessStatus = {
  active: 'active', revoked: 'revoked', expired: 'expired',
} as const
export type FormalizationSignatureAccessStatus = ValueOf<
  typeof FormalizationSignatureAccessStatus
>

export const FormalizationSignatureRecipientStatus = {
  invited: 'invited', authenticating: 'authenticating', locked: 'locked',
  authenticated: 'authenticated', reading: 'reading', signing: 'signing',
  submitted: 'submitted', reconciliationRequired: 'reconciliation_required',
  confirmed: 'confirmed', rejected: 'rejected', cancelled: 'cancelled',
  expired: 'expired',
} as const
export type FormalizationSignatureRecipientStatus = ValueOf<
  typeof FormalizationSignatureRecipientStatus
>

export const FormalizationSignatureArtifactKind = {
  signedPdf: 'signed_pdf', providerCertificate: 'provider_certificate',
  providerEvidence: 'provider_evidence',
} as const
export type FormalizationSignatureArtifactKind = ValueOf<
  typeof FormalizationSignatureArtifactKind
>

export const FormalizationSignatureRequestStatus = {
  provisioning: 'provisioning', sending: 'sending', sent: 'sent',
  inProgress: 'in_progress',
  partiallySubmitted: 'partially_submitted', submitted: 'submitted',
  reconciliationRequired: 'reconciliation_required', confirmed: 'confirmed',
  rejected: 'rejected', cancelled: 'cancelled', expired: 'expired', failed: 'failed',
} as const
export type FormalizationSignatureRequestStatus = ValueOf<
  typeof FormalizationSignatureRequestStatus
>

export const FormalizationSignatureRequestDocumentStatus = {
  pending: 'pending', processing: 'processing', provisioned: 'provisioned',
  deliveryPending: 'delivery_pending', sent: 'sent', submitted: 'submitted',
  reconciliationRequired: 'reconciliation_required', confirmed: 'confirmed',
  rejected: 'rejected', cancelled: 'cancelled', expired: 'expired', failed: 'failed',
} as const
export type FormalizationSignatureRequestDocumentStatus = ValueOf<
  typeof FormalizationSignatureRequestDocumentStatus
>

export const FormalizationSignatureProviderEnvelopeStatus = {
  draft: 'draft', pending: 'pending', inProgress: 'in_progress',
  completed: 'completed', rejected: 'rejected', cancelled: 'cancelled',
  expired: 'expired',
} as const
export type FormalizationSignatureProviderEnvelopeStatus = ValueOf<
  typeof FormalizationSignatureProviderEnvelopeStatus
>

export const FormalizationSignatureProviderItemStatus = {
  pending: 'pending', completed: 'completed', rejected: 'rejected',
  cancelled: 'cancelled', expired: 'expired',
} as const
export type FormalizationSignatureProviderItemStatus = ValueOf<
  typeof FormalizationSignatureProviderItemStatus
>

export const FormalizationSignatureResultStatus = {
  submitted: 'submitted', reconciliationPending: 'reconciliation_pending',
  confirmed: 'confirmed', rejected: 'rejected', cancelled: 'cancelled',
  expired: 'expired',
} as const
export type FormalizationSignatureResultStatus = ValueOf<
  typeof FormalizationSignatureResultStatus
>
export const FormalizationSignaturePendingResultStatus = {
  submitted: FormalizationSignatureResultStatus.submitted,
  reconciliationPending: FormalizationSignatureResultStatus.reconciliationPending,
} as const
export type FormalizationSignaturePendingResultStatus = ValueOf<
  typeof FormalizationSignaturePendingResultStatus
>

export type FormalizationSignatureRequest = Entity & {
  formalizationId: string
  signatureConfigurationVersion: number
  snapshotId: string
  confirmationKeyHash: string
  status: FormalizationSignatureRequestStatus
  version: number
  createdBy: string
  createdAt: Date
  sentAt?: Date
  submittedAt?: Date
  confirmedAt?: Date
  terminalAt?: Date
  cancellationRequestedAt?: Date
  updatedAt: Date
}

export type FormalizationSignatureSnapshot = Entity & {
  formalizationId: string
  formalizationVersion: number
  signatureConfigurationVersion: number
  snapshotHash: string
  createdBy: string
  createdAt: Date
}

export type FormalizationSignatureRequestDocument = Entity & {
  requestId: string
  sourceDocumentId: string
  sourceDocumentVersionId: string
  signaturePreviewId: string
  unsignedPrivateFileId: string
  unsignedSha256: string
  byteCount: number
  pageCount: number
  position: number
  status: FormalizationSignatureRequestDocumentStatus
  version: number
  provisionedAt?: Date
  submittedAt?: Date
  confirmedAt?: Date
  terminalAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type FormalizationSignatureRecipient = Entity & {
  requestId: string
  signatoryId: string
  personId: string
  actorKind: FormalizationSignatureRecipientKind
  displayNameSnapshot: string
  deliveryChannel: FormalizationSignatureChannelKind
  status: FormalizationSignatureRecipientStatus
  version: number
  invitedAt?: Date
  submittedAt?: Date
  submissionObservationId?: string
  confirmedAt?: Date
  terminalAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type FormalizationSignatureRecipientDocument = Entity & {
  requestId: string
  recipientId: string
  requestDocumentId: string
  createdAt: Date
}

export type FormalizationSignatureProviderResource = Entity & {
  requestId: string
  provider: 'documenso'
  providerContractVersion: string
  providerEnvelopeId: string
  providerExternalId: string
  idempotencyKey: string
  lastReconciledAt?: Date
  createdAt: Date
}

export type FormalizationSignatureProviderDocumentResource = Entity & {
  requestId: string
  providerResourceId: string
  requestDocumentId: string
  providerEnvelopeItemId: string
  createdAt: Date
}

export type FormalizationSignatureProviderRecipientResource = Entity & {
  requestId: string
  providerResourceId: string
  recipientId: string
  providerRecipientId: string
  encryptedSigningCredential: string
  cipherKeyId: string
  lastReconciledAt?: Date
  createdAt: Date
}

export type FormalizationSignatureProvisioningAttempt = Entity & {
  requestId: string
  attemptToken: string
  status: 'pending' | 'processing' | 'provisioned' | 'reconciliation_required' | 'failed'
  attempts: number
  leaseExpiresAt?: Date
  nextAttemptAt?: Date
  lastFailureCode?: string
  createdAt: Date
  updatedAt: Date
}

export type FormalizationSignatureCancellationAttempt = Entity & {
  requestId: string
  attemptToken: string
  status: 'pending' | 'processing' | 'cancelled' | 'failed'
  attempts: number
  requestedBy: string
  requestedAt: Date
  leaseExpiresAt?: Date
  nextAttemptAt?: Date
  lastFailureCode?: string
  updatedAt: Date
}

export type FormalizationSignatureInvitation = Entity & {
  requestId: string
  recipientId: string
  tokenHash: string
  generation: number
  status: FormalizationSignatureInvitationStatus
  deliveryStatus: 'pending' | 'delivered' | 'failed'
  expiresAt: Date
  communicationMessageId?: string
  deliveredAt?: Date
  consumedAt?: Date
  revokedAt?: Date
  revocationReason?: string
  createdAt: Date
}

export type FormalizationSignatureInvitationSendAttempt = Entity & {
  invitationId: string
  encryptedPayload: string
  cipherKeyId: string
  status: 'pending' | 'delivered' | 'failed'
  communicationMessageId?: string
  attempts: number
  nextAttemptAt?: Date
  deliveredAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type FormalizationSignatureOtpChallenge = Entity & {
  invitationId: string
  generation: number
  codeMac: string
  channelChoiceId: string
  destinationFingerprint: string
  status: FormalizationSignatureOtpChallengeStatus
  failedAttempts: number
  issuedAt: Date
  sentAt?: Date
  expiresAt?: Date
  consumedAt?: Date
}

export type FormalizationSignatureOtpGuard = {
  invitationId: string
  failedAttempts: number
  rollingWindowStartedAt: Date
  sendsInWindow: number
  lastSentAt?: Date
  lockedUntil?: Date
  updatedAt: Date
  version: number
}

export type FormalizationSignatureOtpSendAttempt = Entity & {
  challengeId: string
  encryptedPayload: string
  cipherKeyId: string
  status: 'pending' | 'delivered' | 'failed'
  providerMessageId?: string
  attempts: number
  nextAttemptAt?: Date
  deliveredAt?: Date
}

export type FormalizationSignatureOtpRateReservation = Entity & {
  invitationId: string
  sourceIpHash: string
  reservedAt: Date
}

export type FormalizationSignatureGatewaySession = Entity & {
  requestId: string
  recipientId: string
  snapshotId: string
  kind: FormalizationSignatureGatewaySessionKind
  tokenHash: string
  deviceSecretHash: string
  csrfHash: string
  status: FormalizationSignatureAccessStatus
  issuedAt: Date
  expiresAt: Date
  revokedAt?: Date
  revocationReason?: string
  version: number
}

export type FormalizationSignatureProxyBinding = Entity & {
  sessionId: string
  requestId: string
  recipientId: string
  aliasHash: string
  encryptedProviderCredential: string
  cipherKeyId: string
  providerContractVersion: string
  status: FormalizationSignatureAccessStatus
  expiresAt: Date
  revokedAt?: Date
  revocationReason?: string
}

export type FormalizationSignatureDocumentAcknowledgement = Entity & {
  requestId: string
  requestDocumentId: string
  recipientId: string
  snapshotId: string
  sessionId: string
  acknowledgedAt: Date
  sourceIpHash?: string
  userAgentHash?: string
  createdAt: Date
}

export type FormalizationSignatureWebhookReceipt = Entity & {
  dedupeKey: string
  hintKind: 'observation' | 'reconciliation_only'
  encryptedHint: string
  cipherKeyId: string
  status: 'pending' | 'processing' | 'processed' | 'failed'
  receivedAt: Date
  claimToken?: string
  leaseUntil?: Date
  attempts: number
  nextAttemptAt?: Date
  processedAt?: Date
}

export type FormalizationSignatureArtifact = Entity & {
  requestId: string
  requestDocumentId?: string
  kind: FormalizationSignatureArtifactKind
  privateFileId: string
  sha256: string
  byteCount: number
  mediaType: string
  providerReference?: string
  preservedAt: Date
}

export type FormalizationSignatureProtocol = Entity & {
  requestId: string
  recipientId: string
  number: string
  artifactSetHash: string
  confirmedAt: Date
}

export type FormalizationSignatureProviderObservation = {
  providerEnvelopeId: string
  envelopeStatus: FormalizationSignatureProviderEnvelopeStatus
  recipients: ReadonlyArray<{
    providerRecipientId: string
    recipientStatus: FormalizationSignatureRecipientStatus
    items: ReadonlyArray<{
      providerEnvelopeItemId: string
      assignment: 'required' | 'not_required'
      status: FormalizationSignatureProviderItemStatus
      requiredFieldCount: number
      completedFieldCount: number
    }>
  }>
  occurredAt: Date
  receivedAt: Date
}

export type FormalizationSignatureAuthenticationChannel = {
  id: string
  kind: FormalizationSignatureChannelKind
  maskedDestination: string
}

export type FormalizationSignatureAuthenticationChannels =
  | []
  | [FormalizationSignatureAuthenticationChannel]

export type FormalizationSignatureAuthenticationSource = {
  personId: string
  actorKind: FormalizationSignatureRecipientKind
  active: boolean
  collaboratorRole?: 'lawyer' | 'paralegal' | 'supervisor'
  channels: FormalizationSignatureAuthenticationChannels
}

export type FormalizationSignatureInvitationChanges = {
  readonly status?: FormalizationSignatureInvitationStatus
  readonly deliveryStatus?: FormalizationSignatureInvitation['deliveryStatus']
  readonly communicationMessageId?: string
  readonly deliveredAt?: Date
  readonly consumedAt?: Date
  readonly revokedAt?: Date
  readonly revocationReason?: string
}
export type FormalizationSignatureInvitationSendAttemptChanges = {
  readonly status?: FormalizationSignatureInvitationSendAttempt['status']
  readonly communicationMessageId?: string
  readonly attempts?: number
  readonly nextAttemptAt?: Date
  readonly deliveredAt?: Date
  readonly updatedAt: Date
}
export type FormalizationSignatureRequestChanges = {
  readonly status?: FormalizationSignatureRequestStatus
  readonly sentAt?: Date
  readonly submittedAt?: Date
  readonly confirmedAt?: Date
  readonly terminalAt?: Date
  readonly cancellationRequestedAt?: Date
}
export type FormalizationSignatureProjectionChanges = {
  readonly signatureRequestId?: string
  readonly signatureStatus: FormalizationSignatureRequestStatus
  readonly signatureSubmittedAt?: Date
  readonly signatureConfirmedAt?: Date
  readonly signatureTerminalAt?: Date
}
export type FormalizationSignatureRequestDocumentChanges = {
  readonly status?: FormalizationSignatureRequestDocumentStatus
  readonly provisionedAt?: Date
  readonly submittedAt?: Date
  readonly confirmedAt?: Date
  readonly terminalAt?: Date
}
export type FormalizationSignatureRecipientChanges = {
  readonly status?: FormalizationSignatureRecipientStatus
  readonly invitedAt?: Date
  readonly submittedAt?: Date
  readonly submissionObservationId?: string
  readonly confirmedAt?: Date
  readonly terminalAt?: Date
}
export type FormalizationSignatureProvisioningAttemptChanges = {
  readonly attemptToken?: string
  readonly status?: FormalizationSignatureProvisioningAttempt['status']
  readonly attempts?: number
  readonly leaseExpiresAt?: Date
  readonly nextAttemptAt?: Date
  readonly lastFailureCode?: string
  readonly updatedAt: Date
}
export type FormalizationSignatureProviderResourceChanges = {
  readonly lastReconciledAt: Date
}
export type FormalizationSignatureProviderRecipientResourceChanges = {
  readonly lastReconciledAt: Date
}
export type FormalizationSignatureCancellationAttemptChanges = {
  readonly attemptToken?: string
  readonly status?: FormalizationSignatureCancellationAttempt['status']
  readonly attempts?: number
  readonly leaseExpiresAt?: Date
  readonly nextAttemptAt?: Date
  readonly lastFailureCode?: string
  readonly updatedAt: Date
}
export type FormalizationSignatureOtpChallengeChanges = {
  readonly status?: FormalizationSignatureOtpChallengeStatus
  readonly failedAttempts?: number
  readonly sentAt?: Date
  readonly expiresAt?: Date
  readonly consumedAt?: Date
}
export type FormalizationSignatureOtpGuardChanges = {
  readonly failedAttempts?: number
  readonly rollingWindowStartedAt?: Date
  readonly sendsInWindow?: number
  readonly lastSentAt?: Date
  readonly lockedUntil?: Date
  readonly updatedAt: Date
}
export type FormalizationSignatureOtpSendAttemptChanges = {
  readonly status?: 'pending' | 'delivered' | 'failed'
  readonly providerMessageId?: string
  readonly attempts?: number
  readonly nextAttemptAt?: Date
  readonly deliveredAt?: Date
}
export type FormalizationSignatureGatewaySessionChanges = {
  readonly kind?: FormalizationSignatureGatewaySessionKind
  readonly tokenHash?: string
  readonly csrfHash?: string
  readonly status?: FormalizationSignatureAccessStatus
  readonly expiresAt?: Date
  readonly revokedAt?: Date
  readonly revocationReason?: string
}
export type FormalizationSignatureProxyBindingChanges = {
  readonly aliasHash?: string
  readonly status?: FormalizationSignatureAccessStatus
  readonly expiresAt?: Date
  readonly revokedAt?: Date
  readonly revocationReason?: string
}
export type FormalizationSignatureWebhookReceiptChanges = {
  readonly status?: 'pending' | 'processing' | 'processed' | 'failed'
  readonly claimToken?: string | null
  readonly leaseUntil?: Date | null
  readonly attempts?: number
  readonly nextAttemptAt?: Date
  readonly processedAt?: Date
}
```

These request-side declarations are revision-5 contracts. They are created from
the existing `FormalizationSignatureConfiguration`; they do not replace
`FormalizationSignatory`, `FormalizationSignatoryDocument`,
`FormalizationSignatureField` or `FormalizationSignaturePreview`. The Formalization
projection adds `signatureRequestId?: string`,
`signatureStatus?: FormalizationSignatureRequestStatus`, `signatureSubmittedAt?: Date`,
`signatureConfirmedAt?: Date` and `signatureTerminalAt?: Date`; its
optimistic `version` protects every transition.

## Repository and provider ports

Repositories are plural, persistence-shaped ports. Their only write vocabulary is
`add`, `addMany`, `replace`, `remove` and `removeAll`; there is no `save` method and no
business-named `updateRevokeStatus` repository operation. Revocation is an explicit
`replace({ changes: { status: 'revoked', ... } })`. Each interface below lives in its
own file under `packages/core/src/formalization/interfaces`.

```ts
export interface FormalizationSignatureInvitationsRepository {
  add(invitation: FormalizationSignatureInvitation): Promise<void>
  findByTokenHash(tokenHash: string): Promise<FormalizationSignatureInvitation | null>
  findActiveByRecipientId(recipientId: string): Promise<FormalizationSignatureInvitation | null>
  replace(input: { invitationId: string; changes: FormalizationSignatureInvitationChanges }): Promise<void>
}
export interface FormalizationSignatureInvitationSendAttemptsRepository {
  add(attempt: FormalizationSignatureInvitationSendAttempt): Promise<void>
  findById(attemptId: string): Promise<FormalizationSignatureInvitationSendAttempt | null>
  findByInvitationId(invitationId: string): Promise<FormalizationSignatureInvitationSendAttempt | null>
  findPending(now: Date, limit: number): Promise<FormalizationSignatureInvitationSendAttempt[]>
  replace(input: { attemptId: string; changes: FormalizationSignatureInvitationSendAttemptChanges }): Promise<void>
}
export interface FormalizationSignatureRequestsRepository {
  add(request: FormalizationSignatureRequest): Promise<void>
  findById(requestId: string): Promise<FormalizationSignatureRequest | null>
  findByConfirmationKeyHash(confirmationKeyHash: string): Promise<FormalizationSignatureRequest | null>
  findCurrentByFormalizationId(formalizationId: string): Promise<FormalizationSignatureRequest | null>
  replace(input: { requestId: string; expectedVersion: number; changes: FormalizationSignatureRequestChanges }): Promise<boolean>
}
export interface FormalizationSignatureSnapshotsRepository {
  add(snapshot: FormalizationSignatureSnapshot): Promise<void>
  findById(snapshotId: string): Promise<FormalizationSignatureSnapshot | null>
  findByHash(snapshotHash: string): Promise<FormalizationSignatureSnapshot | null>
}
export interface FormalizationSignatureRequestDocumentsRepository {
  addMany(documents: readonly FormalizationSignatureRequestDocument[]): Promise<FormalizationSignatureRequestDocument[]>
  findById(requestDocumentId: string): Promise<FormalizationSignatureRequestDocument | null>
  listByRequestId(requestId: string): Promise<FormalizationSignatureRequestDocument[]>
  replace(input: { requestDocumentId: string; expectedVersion: number; changes: FormalizationSignatureRequestDocumentChanges }): Promise<boolean>
}
export interface FormalizationSignatureRecipientsRepository {
  addMany(recipients: readonly FormalizationSignatureRecipient[]): Promise<FormalizationSignatureRecipient[]>
  findById(recipientId: string): Promise<FormalizationSignatureRecipient | null>
  listByRequestId(requestId: string): Promise<FormalizationSignatureRecipient[]>
  replace(input: { recipientId: string; expectedVersion: number; changes: FormalizationSignatureRecipientChanges }): Promise<boolean>
}
export interface FormalizationSignatureRecipientDocumentsRepository {
  addMany(assignments: readonly FormalizationSignatureRecipientDocument[]): Promise<FormalizationSignatureRecipientDocument[]>
  listByRequestId(requestId: string): Promise<FormalizationSignatureRecipientDocument[]>
  listByRecipientId(recipientId: string): Promise<FormalizationSignatureRecipientDocument[]>
  listByRequestDocumentId(requestDocumentId: string): Promise<FormalizationSignatureRecipientDocument[]>
}
export interface FormalizationSignatureProviderResourcesRepository {
  add(resource: FormalizationSignatureProviderResource): Promise<void>
  findByRequestId(requestId: string): Promise<FormalizationSignatureProviderResource | null>
  findByProviderEnvelopeId(providerEnvelopeId: string): Promise<FormalizationSignatureProviderResource | null>
  replace(input: { resourceId: string; changes: FormalizationSignatureProviderResourceChanges }): Promise<void>
}
export interface FormalizationSignatureProviderDocumentResourcesRepository {
  addMany(resources: readonly FormalizationSignatureProviderDocumentResource[]): Promise<FormalizationSignatureProviderDocumentResource[]>
  listByProviderResourceId(providerResourceId: string): Promise<FormalizationSignatureProviderDocumentResource[]>
  findByRequestDocumentId(requestDocumentId: string): Promise<FormalizationSignatureProviderDocumentResource | null>
  findByProviderEnvelopeItemId(providerEnvelopeItemId: string): Promise<FormalizationSignatureProviderDocumentResource | null>
}
export interface FormalizationSignatureProviderRecipientResourcesRepository {
  addMany(resources: readonly FormalizationSignatureProviderRecipientResource[]): Promise<FormalizationSignatureProviderRecipientResource[]>
  listByProviderResourceId(providerResourceId: string): Promise<FormalizationSignatureProviderRecipientResource[]>
  findByRecipientId(recipientId: string): Promise<FormalizationSignatureProviderRecipientResource | null>
  findByProviderRecipientId(providerRecipientId: string): Promise<FormalizationSignatureProviderRecipientResource | null>
  replace(input: { resourceId: string; changes: FormalizationSignatureProviderRecipientResourceChanges }): Promise<void>
}
export interface FormalizationSignatureProvisioningAttemptsRepository {
  add(attempt: FormalizationSignatureProvisioningAttempt): Promise<void>
  findByRequestId(requestId: string): Promise<FormalizationSignatureProvisioningAttempt | null>
  findPending(now: Date, limit: number): Promise<FormalizationSignatureProvisioningAttempt[]>
  replace(input: { attemptId: string; changes: FormalizationSignatureProvisioningAttemptChanges }): Promise<void>
}
export interface FormalizationSignatureCancellationAttemptsRepository {
  add(attempt: FormalizationSignatureCancellationAttempt): Promise<void>
  findByRequestId(requestId: string): Promise<FormalizationSignatureCancellationAttempt | null>
  findPending(now: Date, limit: number): Promise<FormalizationSignatureCancellationAttempt[]>
  replace(input: { attemptId: string; changes: FormalizationSignatureCancellationAttemptChanges }): Promise<void>
}
export interface FormalizationSignatureOtpChallengesRepository {
  add(challenge: FormalizationSignatureOtpChallenge): Promise<void>
  findCurrentByInvitationId(invitationId: string): Promise<FormalizationSignatureOtpChallenge | null>
  replace(input: { challengeId: string; changes: FormalizationSignatureOtpChallengeChanges }): Promise<void>
}
export interface FormalizationSignatureOtpGuardsRepository {
  add(guard: FormalizationSignatureOtpGuard): Promise<void>
  findByInvitationId(invitationId: string): Promise<FormalizationSignatureOtpGuard | null>
  replace(input: { invitationId: string; changes: FormalizationSignatureOtpGuardChanges }): Promise<void>
}
export interface FormalizationSignatureOtpSendAttemptsRepository {
  add(attempt: FormalizationSignatureOtpSendAttempt): Promise<void>
  findById(attemptId: string): Promise<FormalizationSignatureOtpSendAttempt | null>
  findPending(now: Date, limit: number): Promise<FormalizationSignatureOtpSendAttempt[]>
  replace(input: { attemptId: string; changes: FormalizationSignatureOtpSendAttemptChanges }): Promise<void>
}
export interface FormalizationSignatureOtpRateReservationsRepository {
  add(reservation: FormalizationSignatureOtpRateReservation): Promise<void>
  countByInvitationIdSince(invitationId: string, since: Date): Promise<number>
  countBySourceIpHashSince(sourceIpHash: string, since: Date): Promise<number>
  removeAllExpired(before: Date): Promise<number>
}
export interface FormalizationSignatureGatewaySessionsRepository {
  add(session: FormalizationSignatureGatewaySession): Promise<void>
  findByTokenHash(tokenHash: string): Promise<FormalizationSignatureGatewaySession | null>
  findActiveByRecipientId(recipientId: string): Promise<FormalizationSignatureGatewaySession[]>
  replace(input: { sessionId: string; expectedVersion: number; changes: FormalizationSignatureGatewaySessionChanges }): Promise<boolean>
}
export interface FormalizationSignatureProxyBindingsRepository {
  add(binding: FormalizationSignatureProxyBinding): Promise<void>
  findByAliasHash(aliasHash: string): Promise<FormalizationSignatureProxyBinding | null>
  findActiveByRecipientId(recipientId: string): Promise<FormalizationSignatureProxyBinding[]>
  replace(input: { bindingId: string; expectedAliasHash?: string; changes: FormalizationSignatureProxyBindingChanges }): Promise<boolean>
}
export interface FormalizationSignatureWebhookReceiptsRepository {
  add(receipt: FormalizationSignatureWebhookReceipt): Promise<void>
  findById(receiptId: string): Promise<FormalizationSignatureWebhookReceipt | null>
  findByDedupeKey(dedupeKey: string): Promise<FormalizationSignatureWebhookReceipt | null>
  findPending(now: Date, limit: number): Promise<FormalizationSignatureWebhookReceipt[]>
  replace(input: {
    receiptId: string; changes: FormalizationSignatureWebhookReceiptChanges
  }): Promise<void>
}
export interface FormalizationSignatureArtifactsRepository {
  add(artifact: FormalizationSignatureArtifact): Promise<void>
  findByRequestId(requestId: string): Promise<FormalizationSignatureArtifact[]>
  findByRequestDocumentId(requestDocumentId: string): Promise<FormalizationSignatureArtifact[]>
}
export interface FormalizationSignatureDocumentAcknowledgementsRepository {
  add(acknowledgement: FormalizationSignatureDocumentAcknowledgement): Promise<void>
  findByRecipientDocumentAndSnapshot(input: { recipientId: string; requestDocumentId: string; snapshotId: string }): Promise<FormalizationSignatureDocumentAcknowledgement | null>
  listByRecipientAndSnapshot(input: { recipientId: string; snapshotId: string }): Promise<FormalizationSignatureDocumentAcknowledgement[]>
}
export interface FormalizationSignatureProtocolsRepository {
  add(protocol: FormalizationSignatureProtocol): Promise<void>
  findByRecipientAndRequest(input: { recipientId: string; requestId: string }): Promise<FormalizationSignatureProtocol | null>
}
export interface FormalizationSignatureAuditWriter {
  add(input: {
    readonly requestId?: string; readonly recipientId?: string
    readonly invitationId?: string; readonly sessionId?: string
    readonly action: string; readonly actorKind?: FormalizationSignatureRecipientKind
    readonly actorReference?: string; readonly occurredAt: Date
    readonly correlationId: string; readonly sourceIpHash?: string
    readonly userAgentHash?: string; readonly metadata: Readonly<Record<string, string | number | boolean | null>>
  }): Promise<void>
}
```

The request-side repositories above are authoritative. `add`/`addMany` create rows;
`replace` performs explicit low-level optimistic changes; no repository method is named
`save`, `cancel`, `revoke` or `updateStatus`. Business verbs remain use cases.

Do not introduce a separate Identity reader. Extend the existing
`FormalizationSignatureSourceReader` with the following methods; its Server adapter
continues to own the permitted Identity/Document Production repository composition.
Assignment itself is read from the Formalization request recipient, not Identity.

```ts
export interface FormalizationSignatureSourceReader {
  findPerson(personId: string): Promise<FormalizationSignatureSourcePerson | null>
  listEligibleCandidates(input: {
    readonly formalizationId: string
    readonly page: number
    readonly limit: number
    readonly search?: string
    readonly excludedPersonIds: readonly string[]
  }): Promise<FormalizationSignatureCandidatePage>
  listCurrentDocuments(
    formalizationId: string,
  ): Promise<ReadonlyArray<FormalizationSignatureSourceDocument>>
  findCurrentDocument(
    formalizationId: string,
    documentId: string,
  ): Promise<FormalizationSignatureSourceDocument | null>
  findDocumentVersion(
    formalizationId: string,
    documentVersionId: string,
  ): Promise<FormalizationSignatureSourceDocument | null>
  findAuthenticationSource(
    personId: string,
  ): Promise<FormalizationSignatureAuthenticationSource | null>
  listConsentedAuthenticationChannels(
    personId: string,
  ): Promise<FormalizationSignatureAuthenticationChannels>
}
```

Provider ports use inline input/output shapes so they introduce no undeclared exported
DTO. No Documenso DTO or raw recipient credential crosses this adapter boundary.

```ts
export interface SignatureProvider {
  getContractVersion(): string
  createEnvelope(input: {
    externalId: string; title: string
    documents: ReadonlyArray<{
      externalId: string; title: string
      bytes: Uint8Array; mediaType: 'application/pdf'; sha256: string
    }>
    recipients: ReadonlyArray<{
      externalId: string; name: string; email: string
      fields: ReadonlyArray<{
        documentExternalId: string; page: number; x: number; y: number
        width: number; height: number; type: 'signature'
      }>
    }>
    distribution: 'none'
  }): Promise<{
    providerEnvelopeId: string
    documents: ReadonlyArray<{ externalId: string; providerEnvelopeItemId: string }>
    recipients: ReadonlyArray<{ externalId: string; providerRecipientId: string; rawSigningCredential: string }>
  }>
  findEnvelopeByExternalId(externalId: string, expected?: {
    documents: ReadonlyArray<{ externalId: string }>
    recipients: ReadonlyArray<{ externalId: string }>
  }): Promise<{
    providerEnvelopeId: string
    documents: ReadonlyArray<{ externalId: string; providerEnvelopeItemId: string }>
    recipients: ReadonlyArray<{ externalId: string; providerRecipientId: string; rawSigningCredential: string }>
  } | null>
  distributeEnvelope(input: { providerEnvelopeId: string; distribution: 'none' }): Promise<void>
  cancelEnvelope(input: { providerEnvelopeId: string }): Promise<'cancelled' | 'already_terminal'>
  findEnvelopeState(input: {
    providerEnvelopeId: string
  }): Promise<FormalizationSignatureProviderObservation>
  createSigningBinding(input: {
    providerEnvelopeId: string; providerRecipientId: string
  }): Promise<{ encryptedCredential: string; cipherKeyId: string; expiresAt: Date }>
  downloadCompletedArtifacts(input: {
    providerEnvelopeId: string
    documents: ReadonlyArray<{
      requestDocumentId: string; providerEnvelopeItemId: string
    }>
  }): Promise<Array<{
    kind: FormalizationSignatureArtifactKind; bytes: Uint8Array
    requestDocumentId?: string; mediaType: string; providerReference?: string
  }>>
}
export interface SensitivePayloadCipherProvider {
  encrypt(input: {
    plaintext: Uint8Array; purpose: 'invitation_delivery' | 'otp_delivery' | 'provider_credential' | 'webhook'
    contextId: string
  }): Promise<{ ciphertext: string; keyId: string }>
  decrypt(input: {
    ciphertext: string; keyId: string
    purpose: 'invitation_delivery' | 'otp_delivery' | 'provider_credential' | 'webhook'; contextId: string
  }): Promise<Uint8Array>
}
```

Reuse the existing private file, clock, ID and random provider interfaces rather than
creating signature-specific duplicates. Security tokens use the cryptographic random
provider, never `IdProvider` or `Math.random`.

Use cases decide eligibility, state transitions and intended mutations. A focused
`FormalizationSignatureGatewayTransaction` port atomically applies the already-decided
multi-row mutations. Its Drizzle adapter owns `database.transaction`, row locks and
transaction-bound repository instances, matching the existing Formalization
confirmation transaction pattern. It does not hide business policy inside a generic
unit of work.

```ts
export interface FormalizationSignatureGatewayTransaction {
  confirmSending(input: {
    formalizationId: string
    expectedFormalizationVersion: number
    expectedSignatureConfigurationVersion: number
    snapshot: FormalizationSignatureSnapshot
    request: FormalizationSignatureRequest
    documents: readonly FormalizationSignatureRequestDocument[]
    recipients: readonly FormalizationSignatureRecipient[]
    recipientDocuments: readonly FormalizationSignatureRecipientDocument[]
    provisioningAttempt: FormalizationSignatureProvisioningAttempt
    formalizationChanges: FormalizationSignatureProjectionChanges & {
      readonly signatureRequestId: string
      readonly signatureStatus: typeof FormalizationSignatureRequestStatus.provisioning
    }
  }): Promise<'applied' | 'conflict' | 'duplicate'>
  requestCancellation(input: {
    requestId: string
    expectedRequestVersion: number
    requestChanges: FormalizationSignatureRequestChanges
    cancellationAttempt: FormalizationSignatureCancellationAttempt
    invitationIdsToRevoke: readonly string[]
    invitationChanges: FormalizationSignatureInvitationChanges
    sessionIdsToRevoke: readonly string[]
    sessionChanges: FormalizationSignatureGatewaySessionChanges
    bindingIdsToRevoke: readonly string[]
    bindingChanges: FormalizationSignatureProxyBindingChanges
    formalizationId: string
    expectedFormalizationVersion: number
    formalizationChanges: FormalizationSignatureProjectionChanges
  }): Promise<'applied' | 'conflict' | 'already_terminal'>
  completeProvisioning(input: {
    requestId: string
    expectedRequestVersion: number
    requestChanges: FormalizationSignatureRequestChanges
    requestDocumentChanges: ReadonlyArray<{
      requestDocumentId: string
      expectedVersion: number
      changes: FormalizationSignatureRequestDocumentChanges
    }>
    recipientChanges: ReadonlyArray<{ recipientId: string; expectedVersion: number; changes: FormalizationSignatureRecipientChanges }>
    resource: FormalizationSignatureProviderResource
    providerDocumentResources: readonly FormalizationSignatureProviderDocumentResource[]
    providerRecipientResources: readonly FormalizationSignatureProviderRecipientResource[]
    invitations: readonly FormalizationSignatureInvitation[]
    invitationSendAttempts: readonly FormalizationSignatureInvitationSendAttempt[]
    provisioningAttemptId: string
    provisioningAttemptChanges: FormalizationSignatureProvisioningAttemptChanges
    formalizationId: string
    expectedFormalizationVersion: number
    formalizationChanges: FormalizationSignatureProjectionChanges
  }): Promise<'applied' | 'conflict' | 'already_provisioned'>
  recordInvitationDeliveryAndDerive(input: {
    invitationId: string
    expectedInvitationGeneration: number
    invitationChanges: FormalizationSignatureInvitationChanges
    deliveryAttemptId: string
    deliveryAttemptChanges: FormalizationSignatureInvitationSendAttemptChanges
    recipientId: string
    expectedRecipientVersion: number
    recipientChanges: FormalizationSignatureRecipientChanges
    requestId: string
    expectedRequestVersion: number
    requestChanges: FormalizationSignatureRequestChanges
    formalizationId: string
    expectedFormalizationVersion: number
    formalizationChanges: FormalizationSignatureProjectionChanges
  }): Promise<'applied' | 'conflict' | 'duplicate'>
  exchangeInvitation(input: {
    invitationId: string; expectedInvitationGeneration: number
    invitationChanges?: FormalizationSignatureInvitationChanges
    flowSessionIdsToRevoke: ReadonlyArray<string>
    flowSessionChanges: FormalizationSignatureGatewaySessionChanges
    flowSession: FormalizationSignatureGatewaySession
  }): Promise<'applied' | 'conflict'>
  establishCollaboratorSession(input: {
    invitationId: string; expectedInvitationGeneration: number
    invitationChanges: FormalizationSignatureInvitationChanges
    flowSessionId: string; expectedFlowSessionVersion: number
    flowSessionChanges: FormalizationSignatureGatewaySessionChanges
    authenticatedSessionIdsToRevoke: ReadonlyArray<string>
    authenticatedSessionChanges: FormalizationSignatureGatewaySessionChanges
    authenticatedSession: FormalizationSignatureGatewaySession
    recipientId: string; expectedRecipientVersion: number
    recipientChanges: { readonly status: 'authenticated' }
    requestId: string; expectedRequestVersion: number
    requestChanges?: { readonly status: 'in_progress' }
  }): Promise<'applied' | 'conflict'>
  acknowledgeDocument(input: {
    sessionId: string
    expectedSessionVersion: number
    requestId: string
    expectedRequestVersion: number
    requestDocumentId: string
    acknowledgement: FormalizationSignatureDocumentAcknowledgement
  }): Promise<'applied' | 'conflict' | 'duplicate'>
  issueOtp(input: {
    invitationId: string; expectedInvitationGeneration: number
    expectedGuardVersion: number; expectedInvitationSendCount: number
    expectedSourceIpSendCount: number; previousChallengeId?: string
    previousChallengeChanges?: FormalizationSignatureOtpChallengeChanges
    challenge: FormalizationSignatureOtpChallenge
    guardChanges: FormalizationSignatureOtpGuardChanges
    deliveryAttempt: FormalizationSignatureOtpSendAttempt
    rateReservation: FormalizationSignatureOtpRateReservation
  }): Promise<'issued' | 'conflict'>
  verifyOtp(input: {
    challengeId: string; expectedChallengeGeneration: number
    challengeChanges: FormalizationSignatureOtpChallengeChanges
    invitationId: string; expectedGuardVersion: number
    guardChanges: FormalizationSignatureOtpGuardChanges
    flowSessionId: string; expectedFlowSessionVersion: number
    flowSessionChanges: FormalizationSignatureGatewaySessionChanges
    authenticatedSessionIdsToRevoke: ReadonlyArray<string>
    authenticatedSessionChanges: FormalizationSignatureGatewaySessionChanges
    authenticatedSession?: FormalizationSignatureGatewaySession
  }): Promise<'applied' | 'conflict'>
  startProviderEntry(input: {
    sessionId: string
    expectedSessionVersion: number
    requestId: string
    expectedRequestVersion: number
    recipientId: string
    expectedRecipientVersion: number
    operation:
      | { readonly kind: 'create'; readonly binding: FormalizationSignatureProxyBinding }
      | {
          readonly kind: 'rotate'
          readonly bindingId: string
          readonly expectedAliasHash: string
          readonly replacementAliasHash: string
          readonly replacementExpiresAt: Date
        }
    recipientChanges: { readonly status: 'signing' }
  }): Promise<'created' | 'rotated' | 'conflict' | 'invalid_binding'>
  recordSubmission(input: {
    requestId: string
    recipientId: string
    expectedRecipientVersion: number
    sessionId: string
    expectedSessionVersion: number
    bindingId: string
    expectedBindingAliasHash: string
    providerObservationId: string
    submittedAt: Date
  }): Promise<'applied' | 'duplicate' | 'conflict'>
  claimWebhookReceipt(input: {
    receiptId: string
    claimToken: string
    now: Date
    leaseUntil: Date
  }): Promise<
    | { outcome: 'claimed' | 'already_processed'; receipt: FormalizationSignatureWebhookReceipt }
    | { outcome: 'missing' | 'busy' }
  >
  failWebhookReceiptClaim(input: {
    receiptId: string
    expectedClaimToken: string
    failedAt: Date
    nextAttemptAt: Date
  }): Promise<'applied' | 'conflict'>
  completeWebhookReceiptClaim(input: {
    receiptId: string
    expectedClaimToken: string
    processedAt: Date
  }): Promise<'applied' | 'conflict'>
  recordProviderObservationAndDerive(input: {
    observationScope: 'partial_hint' | 'authoritative_envelope'
    envelopeStatus: FormalizationSignatureProviderEnvelopeStatus
    receiptUpdates: ReadonlyArray<{
      receiptId: string
      expectedClaimToken?: string
      receiptChanges: FormalizationSignatureWebhookReceiptChanges
    }>
    recipientObservations: ReadonlyArray<{
      recipientId: string
      expectedRecipientVersion: number
      recipientChanges: FormalizationSignatureRecipientChanges
      recipientDocumentObservations: ReadonlyArray<{
        requestDocumentId: string
        providerEnvelopeItemId: string
        assignment: 'required' | 'not_required'
        status: FormalizationSignatureProviderItemStatus
        requiredFieldCount: number
        completedFieldCount: number
      }>
    }>
    requestDocumentChanges: ReadonlyArray<{
      requestDocumentId: string
      expectedVersion: number
      changes: FormalizationSignatureRequestDocumentChanges
    }>
    requestId: string
    expectedRequestVersion: number
  }): Promise<'applied' | 'conflict' | 'unchanged'>
  confirmEnvelopeAndDerive(input: {
    requestId: string
    expectedRequestVersion: number
    recipientChanges: ReadonlyArray<{
      recipientId: string
      expectedVersion: number
      changes: { readonly status: 'confirmed'; readonly confirmedAt: Date }
    }>
    protocols: readonly FormalizationSignatureProtocol[]
    artifactsToAdd: readonly FormalizationSignatureArtifact[]
    requestDocumentChanges: ReadonlyArray<{
      requestDocumentId: string
      expectedVersion: number
      changes: { readonly status: 'confirmed'; readonly confirmedAt: Date }
    }>
  }): Promise<'applied' | 'conflict'>
  deriveTerminalOutcome(input: {
    requestId: string
    expectedRequestVersion: number
    recipientChanges: ReadonlyArray<{ recipientId: string; expectedVersion: number; changes: FormalizationSignatureRecipientChanges }>
    requestDocumentChanges: ReadonlyArray<{ requestDocumentId: string; expectedVersion: number; changes: FormalizationSignatureRequestDocumentChanges }>
    terminalAt: Date
  }): Promise<'applied' | 'conflict' | 'already_terminal'>
}
```

For the shared multi-recipient envelope, reconciliation downloads and validates every
completed envelope item once by `providerEnvelopeId`, supplies `artifactsToAdd` only
when the mapped request-document artifact is absent, and adds one immutable protocol
for each package recipient. Every request document is confirmed only when its signed
item is durable and all recipients assigned to that document are confirmed; request
and Formalization confirmation changes are derived only after every request document
is confirmed. Unique constraints make a replay a no-op, not a second artifact or
protocol insertion. Before artifact confirmation, `recordProviderObservationAndDerive`
receives either a non-terminal `partial_hint` batch or the complete
`authoritative_envelope` recipient-observation batch and applies all supplied receipt updates
plus recipient and request-document observations in one optimistic database transaction. The
adapter locks the current complete graph and derives request and Formalization changes itself;
those aggregate mutations are never caller inputs. A terminal value is invalid in
`partial_hint` mode because the processor must complete only the receipt and schedule
authoritative reconciliation. Receipt updates are independently idempotent: an already
processed receipt is a no-op for that row, mixed old/new receipts remain valid, and receipt
deduplication never short-circuits a newer provider-state transition. Every non-processed
receipt update must match its persisted `expectedClaimToken` and an unexpired lease; a
missing/mismatched/expired claim rejects the complete batch as a conflict. `unchanged` means the
entire batch is already represented monotonically. Implementations must not retain singular
compatibility fields or loop one request/Formalization compare-and-swap operation per
recipient.

`startProviderEntry` locks the named session/request/recipient and the recipient's active
binding set. `create` succeeds only with no active binding and inserts the supplied binding;
`rotate` succeeds only when exactly one active binding matches the same session, request,
recipient and expected alias hash, then replaces only that hash and expiry. Both modes preserve
the encrypted provider credential, keep the authenticated session active and device-bound, and
atomically advance `reading` to `signing`; `signing` is accepted only for a matching rotation.

`recordSubmission` locks the request, recipient, owning Formalization and every active access
row for that recipient. It persists `providerObservationId` as the normalized HMS observation
identity, verifies the exact active `bindingId` belongs to that session/request/recipient and
matches `expectedBindingAliasHash`, converts the active `sessionId` from authenticated to result
in place without changing its token/device/CSRF hashes or expiry, revokes every active binding
and every other active session, consumes active invitations, and derives
`partially_submitted`/`submitted` plus the matching
Formalization timestamps from the complete locked recipient graph. The converted session has no
document/provider authority because those paths require `kind: 'authenticated'`; it is the
lost-response recovery receipt. A concurrent duplicate may return `duplicate` only when that
same binding is revoked for submission, the same session is already result-only and the
recipient contains the same deterministic observation ID. The proxy computes that normalized
ID as a purpose-separated hash of the HMS binding ID (`submission:<bindingId>`), never from raw
provider payload. The transaction never accepts caller-selected aggregate identity, version or
status.

`confirmEnvelopeAndDerive` and `deriveTerminalOutcome` likewise lock the current complete
request/recipient/document/Formalization graph after validating the supplied row-level
observations. They derive the only legal request status/timestamps and matching Formalization
projection internally; neither operation accepts aggregate changes, Formalization identity or
Formalization version from its caller.

Every method above that creates or derives a request state writes the matching
`FormalizationSignatureProjectionChanges` in the same database transaction and under
the Formalization optimistic version. The mapping is identity-preserving:
`signatureStatus` always equals the derived request status; the submitted, confirmed and
terminal timestamps are copied only when their request counterparts first become
defined and never cleared. Provisioning/delivery transitions use `completeProvisioning`,
provider entry uses `startProviderEntry`, submission uses `recordSubmission`, confirmation uses `confirmEnvelopeAndDerive`, and
rejected/cancelled/expired/failed convergence uses `deriveTerminalOutcome`.
`confirm-formalization-signature-sending-use-case.test.ts`, provisioning,
`mark-formalization-signature-invitation-delivery-use-case.test.ts`, provider-webhook and
reconciliation job tests, submission transaction/controller tests, cancellation tests
and `signing-gateway-migration.test.ts` collectively assert every value of
`FormalizationSignatureRequestStatus`: `provisioning`, `sending`, `sent`, `in_progress`,
`partially_submitted`, `submitted`, `reconciliation_required`, `confirmed`, `rejected`,
`cancelled`, `expired` and `failed`. Each case asserts the request and
`signatureStatus` change atomically, including version conflicts, duplicate/reordered
delivery or provider observations, timestamps and preservation of the last monotonic
projection.

OTP delivery uses the persisted `FormalizationSignatureOtpSendAttempt` as a bounded
delivery work ledger. The use case commits it with the challenge, publishes the
versioned event directly after commit, and a reconciler republishes pending attempts.
This is not a generic outbox abstraction.

## Use cases

| Use case | Input and authoritative outcome |
| --- | --- |
| GetFormalizationSignatureSendingReviewUseCase | Formalization/actor; rereads the ready configuration and live channel consent and returns the authoritative review or blocking issues without secrets. |
| ConfirmFormalizationSignatureSendingUseCase | Formalization/actor/expected version/confirmation key; validates readiness and atomically freezes the configuration and creates the request, documents, package recipients, recipient-document assignments and one provisioning attempt. |
| ProvisionFormalizationSignatureRequestUseCase | One leased request; creates or reconciles its single multi-document provider envelope, envelope-item mappings, recipients and encrypted credentials, then creates one invitation per recipient and publishes invitation-ready events. |
| MarkFormalizationSignatureInvitationDeliveryUseCase | Communication outcome for one send attempt; marks the invitation/recipient/request sent projection or a safe retryable failure without exposing the invitation token. |
| ReconcileFormalizationSignatureInvitationDeliveriesUseCase | Scheduled bounded sweep; republishes only pending/due encrypted invitation send attempts and never creates a new invitation/token. |
| CancelFormalizationSignatureSendingUseCase | Request/actor/version; revokes HMS access immediately and atomically schedules one cancellation for the shared envelope. |
| ProcessFormalizationSignatureCancellationUseCase | One leased request-level cancellation attempt; cancels/reconciles the shared provider envelope idempotently and derives every document/request/Formalization terminal projection. |
| ExchangeSignatureInvitationUseCase | Raw fragment token plus request context; returns only a flow session secret, device secret and CSRF token for cookie/response handling. |
| GetSignatureGatewayContextUseCase | Valid session context; rotates/returns one fresh synchronizer CSRF value under optimistic session version and returns the next safe GET step and generic presentation data allowed for that authentication stage. A still-valid `signing` recipient returns fully acknowledged reading recovery so only the explicit start mutation can rotate a proxy alias. |
| ListSignatureAuthenticationChannelsUseCase | Flow session; rereads Identity e-mail consent and returns either no channel or one opaque e-mail confirmation ID plus its masked value. |
| RequestSignatureOtpUseCase | Flow session, the sole e-mail confirmation ID and risk context; reserves limits, creates the newest challenge and publishes encrypted Resend delivery. |
| MarkSignatureOtpDeliveryUseCase | Communication delivery attempt result; activates the challenge only on successful delivery or records a safe retryable failure. |
| VerifySignatureOtpUseCase | Flow/device/CSRF, challenge and code; rotates to authenticated session or applies one failure/lock atomically. |
| EstablishCollaboratorSigningSessionUseCase | Existing HMS actor plus flow/device; verifies exact current identity, role, status and assignment and creates the bound authenticated session. |
| GetSignatureDocumentUseCase | Authenticated session plus caller-selected request-document ID; revalidates package membership and returns private file metadata/stream capability for that immutable request document. |
| AcknowledgeSignatureDocumentUseCase | Unexpired session, expected request version, request-document ID and explicit acknowledgement; revalidates exact collaborator person/permitted role/assignment when applicable and persists the recipient/document/snapshot acknowledgement idempotently. |
| StartFormalizationSigningUseCase | Session and expected request version; revalidates every required document acknowledgement, atomically creates the first binding or rotates the alias hash of the one matching active binding, advances the recipient to signing and returns the transient package proxy path, never the provider credential. |
| RecordProviderSubmissionUseCase | Classified successful proxy mutation; records the normalized observation ID, atomically converts the presenting authenticated session to result-only, revokes every other signing access row and derives the aggregate projection. It mints and returns no replacement secret. |
| ReceiveSignatureProviderWebhookUseCase | Provider-neutral `hintKind`, dedupe hash and encrypted normalized hint from the Server normalizer; creates one durable receipt and schedules processing without raw provider metadata. |
| ProcessSignatureProviderWebhookUseCase | Claimed provider-neutral receipt hint; applies a strict observation or completes reconciliation-only processing and invokes request reconciliation idempotently. |
| ReconcileSignatureRequestUseCase | HMS request/provider IDs; obtains API authority for the shared envelope and all recipients, preserves every mapped item artifact and package-recipient protocol, then derives document/package/Formalization confirmation only when all required recipients and documents are terminal-successful and durable. |
| GetSignatureResultUseCase | Result receipt; returns the safe recipient result/status/protocol only. |
| CloseSignatureResultUseCase | Result receipt; revokes it and clears client cookies without changing signature state. |
| ExpireSignatureGatewayAccessUseCase | Scheduled sweep; expires invitations/challenges/sessions/bindings and reconciles affected provider recipients. |

Each use-case file declares its non-exported `Request` and `Response` immediately above
the class and implements `UseCase<Request, Response>`. The signatures below are exact;
controllers and jobs map transport data into them and never pass a request object.

```ts
// get-formalization-signature-sending-review-use-case.ts
type Request = { readonly formalizationId: string; readonly actorId: string }
type Response = FormalizationSignatureSendingReview
export class GetFormalizationSignatureSendingReviewUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// confirm-formalization-signature-sending-use-case.ts
type Request = { readonly formalizationId: string; readonly actorId: string; readonly expectedVersion: number; readonly confirmationKey: string }
type Response = { readonly requestId: string; readonly status: FormalizationSignatureRequestStatus; readonly duplicate: boolean }
export class ConfirmFormalizationSignatureSendingUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// provision-formalization-signature-request-use-case.ts
type Request = { readonly requestId: string; readonly attemptToken: string; readonly occurredAt: Date }
type Response = { readonly outcome: 'provisioned' | 'reconciled' | 'already_provisioned' | 'retry_required'; readonly invitationIds: readonly string[] }
export class ProvisionFormalizationSignatureRequestUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// mark-formalization-signature-invitation-delivery-use-case.ts
type Request = { readonly deliveryAttemptId: string; readonly outcome: 'delivered' | 'failed'; readonly communicationMessageId?: string; readonly occurredAt: Date }
type Response = void
export class MarkFormalizationSignatureInvitationDeliveryUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// reconcile-formalization-signature-invitation-deliveries-use-case.ts
type Request = { readonly occurredAt: Date; readonly limit: number }
type Response = { readonly published: number }
export class ReconcileFormalizationSignatureInvitationDeliveriesUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// cancel-formalization-signature-sending-use-case.ts
type Request = { readonly requestId: string; readonly actorId: string; readonly expectedVersion: number }
type Response = { readonly requestId: string; readonly outcome: 'scheduled' | 'already_terminal'; readonly cancellationPending: boolean }
export class CancelFormalizationSignatureSendingUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// process-formalization-signature-cancellation-use-case.ts
type Request = { readonly cancellationAttemptId: string; readonly attemptToken: string; readonly occurredAt: Date }
type Response = { readonly outcome: 'cancelled' | 'already_terminal' | 'retry_required' }
export class ProcessFormalizationSignatureCancellationUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// exchange-signature-invitation-use-case.ts
type Request = { readonly token: string; readonly origin: string; readonly sourceIpHash: string; readonly userAgentHash: string }
type Response = { readonly flowToken: string; readonly deviceToken: string; readonly csrfToken: string; readonly expiresAt: Date }
export class ExchangeSignatureInvitationUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// get-signature-gateway-context-use-case.ts
type Request = { readonly sessionToken: string; readonly deviceToken: string; readonly actorId?: string }
type Response = FormalizationSignatureGatewayContext
export class GetSignatureGatewayContextUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// list-signature-authentication-channels-use-case.ts
type Request = { readonly flowToken: string; readonly deviceToken: string }
type Response = FormalizationSignatureAuthenticationChannels
export class ListSignatureAuthenticationChannelsUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// request-signature-otp-use-case.ts
type Request = { readonly flowToken: string; readonly deviceToken: string; readonly csrfToken: string; readonly channelChoiceId: string; readonly sourceIpHash: string }
type Response = { readonly challengeId: string; readonly expiresAt: Date; readonly resendAvailableAt: Date }
export class RequestSignatureOtpUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// mark-signature-otp-delivery-use-case.ts
type Request = { readonly deliveryAttemptId: string; readonly outcome: 'delivered' | 'failed'; readonly providerMessageId?: string; readonly occurredAt: Date }
type Response = void
export class MarkSignatureOtpDeliveryUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// verify-signature-otp-use-case.ts
type Request = { readonly flowToken: string; readonly deviceToken: string; readonly csrfToken: string; readonly challengeId: string; readonly code: string; readonly sourceIpHash: string }
type Response = { readonly authenticatedToken: string; readonly deviceToken: string; readonly csrfToken: string; readonly expiresAt: Date }
export class VerifySignatureOtpUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// establish-collaborator-signing-session-use-case.ts
type Request = { readonly flowToken: string; readonly deviceToken: string; readonly actorId: string; readonly csrfToken: string }
type Response = { readonly authenticatedToken: string; readonly deviceToken: string; readonly csrfToken: string; readonly expiresAt: Date }
export class EstablishCollaboratorSigningSessionUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// get-signature-document-use-case.ts
type Request = { readonly sessionToken: string; readonly deviceToken: string; readonly requestDocumentId: string; readonly actorId?: string }
type Response = { readonly privateFileId: string; readonly title: string; readonly mediaType: 'application/pdf'; readonly byteCount: number; readonly sha256: string }
export class GetSignatureDocumentUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// acknowledge-signature-document-use-case.ts
type Request = { readonly sessionToken: string; readonly deviceToken: string; readonly csrfToken: string; readonly requestDocumentId: string; readonly expectedRequestVersion: number; readonly acknowledged: true; readonly sourceIpHash: string; readonly userAgentHash: string; readonly actorId?: string }
type Response = { readonly requestDocumentId: string; readonly acknowledgedAt: Date }
export class AcknowledgeSignatureDocumentUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// start-formalization-signing-use-case.ts
type Request = { readonly sessionToken: string; readonly deviceToken: string; readonly csrfToken: string; readonly expectedRequestVersion: number; readonly actorId?: string }
type Response = { readonly proxyPath: string; readonly expiresAt: Date }
export class StartFormalizationSigningUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// record-provider-submission-use-case.ts
type Request = { readonly requestId: string; readonly recipientId: string; readonly sessionId: string; readonly bindingId: string; readonly expectedBindingAliasHash: string; readonly providerObservationId: string; readonly expectedRecipientVersion: number; readonly expectedSessionVersion: number; readonly submittedAt: Date }
type Response = void
export class RecordProviderSubmissionUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// receive-signature-provider-webhook-use-case.ts
type Request = { readonly dedupeKey: string; readonly hintKind: 'observation' | 'reconciliation_only'; readonly encryptedHint: string; readonly cipherKeyId: string; readonly receivedAt: Date }
type Response = { readonly receiptId: string; readonly duplicate: boolean }
export class ReceiveSignatureProviderWebhookUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// process-signature-provider-webhook-use-case.ts
type Request = { readonly receiptId: string; readonly occurredAt: Date }
type Response = { readonly outcome: 'processed' | 'reconciliation_requested' | 'already_processed' | 'retry_required' }
type FormalizationSignatureWebhookProcessingHint =
  | {
      readonly kind: 'observation'
      readonly requestId: string
      readonly expectedRequestVersion: number
      readonly envelopeStatus: FormalizationSignatureProviderEnvelopeStatus
      readonly recipient: {
        readonly recipientId: string
        readonly expectedRecipientVersion: number
        readonly recipientStatus: FormalizationSignatureRecipientStatus
        readonly items: ReadonlyArray<{
          readonly requestDocumentId: string
          readonly expectedVersion: number
          readonly providerEnvelopeItemId: string
          readonly assignment: 'required' | 'not_required'
          readonly status: FormalizationSignatureProviderItemStatus
          readonly requiredFieldCount: number
          readonly completedFieldCount: number
        }>
      }
    }
  | { readonly kind: 'reconciliation_only'; readonly requestId: string }
export class ProcessSignatureProviderWebhookUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// reconcile-signature-request-use-case.ts
type Request = { readonly requestId: string; readonly reason: FormalizationSignatureReconciliationReason; readonly occurredAt: Date }
type Response = { readonly outcome: 'unchanged' | 'submitted' | 'confirmed' | 'terminal' | 'retry_required' }
export class ReconcileSignatureRequestUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// get-signature-result-use-case.ts
type Request = { readonly sessionToken: string; readonly deviceToken: string }
type Response = FormalizationSignatureResult
export class GetSignatureResultUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// close-signature-result-use-case.ts
type Request = { readonly sessionToken: string; readonly deviceToken: string; readonly csrfToken: string }
type Response = void
export class CloseSignatureResultUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}

// expire-signature-gateway-access-use-case.ts
type Request = { readonly occurredAt: Date; readonly limit: number }
type Response = { readonly invitations: number; readonly challenges: number; readonly sessions: number; readonly bindings: number }
export class ExpireSignatureGatewayAccessUseCase implements UseCase<Request, Response> {
  execute(request: Request): Promise<Response>
}
```

The structures referenced above are exact shared Core response types:

```ts
export const FormalizationSignatureSendingIssueCode = {
  notReady: 'not_ready', staleConfiguration: 'stale_configuration',
  documentUnavailable: 'document_unavailable', missingAssignment: 'missing_assignment',
  missingField: 'missing_field', channelUnavailable: 'channel_unavailable',
  consentUnavailable: 'consent_unavailable',
} as const
export type FormalizationSignatureSendingIssueCode = ValueOf<typeof FormalizationSignatureSendingIssueCode>
export type FormalizationSignatureSendingIssue = {
  readonly code: FormalizationSignatureSendingIssueCode
  readonly documentId?: string
  readonly signatoryId?: string
}
export type FormalizationSignatureSendingReview = {
  readonly formalizationId: string
  readonly version: number
  readonly status: FormalizationSignatureStatus
  readonly ready: boolean
  readonly documents: ReadonlyArray<{ readonly id: string; readonly title: string; readonly position: number; readonly pageCount: number; readonly unsignedSha256: string }>
  readonly signatories: ReadonlyArray<{ readonly id: string; readonly displayName: string; readonly actorKind: FormalizationSignatureRecipientKind; readonly deliveryChannel: FormalizationSignatureChannelKind; readonly documentIds: readonly string[] }>
  readonly messagePreview: string
  readonly issues: readonly FormalizationSignatureSendingIssue[]
  readonly currentRequest?: { readonly id: string; readonly status: FormalizationSignatureRequestStatus; readonly version: number; readonly openDocuments: number; readonly totalDocuments: number }
}
export const FormalizationSignatureReconciliationReason = {
  webhook: 'webhook', unknownEvent: 'unknown_event', scheduled: 'scheduled',
  artifactRetry: 'artifact_retry', ambiguousSubmission: 'ambiguous_submission',
} as const
export type FormalizationSignatureReconciliationReason = ValueOf<typeof FormalizationSignatureReconciliationReason>
export type FormalizationSignatureGatewayContext =
  | ({ readonly csrfToken: string } & (
      | { readonly step: 'invitation' }
      | { readonly step: 'choose_channel'; readonly channels: FormalizationSignatureAuthenticationChannels }
      | { readonly step: 'enter_otp'; readonly challengeId: string; readonly expiresAt: Date; readonly resendAvailableAt: Date }
      | { readonly step: 'collaborator_login'; readonly loginPath: string }
      | { readonly step: 'reading'; readonly documents: readonly FormalizationSignatureGatewayDocument[]; readonly acknowledgedDocumentIds: readonly string[]; readonly requestVersion: number }
      | { readonly step: 'submitted'; readonly result: FormalizationSignatureResult & { readonly status: FormalizationSignaturePendingResultStatus } }
      | { readonly step: 'confirmed'; readonly result: FormalizationSignatureResult & { readonly status: typeof FormalizationSignatureResultStatus.confirmed; readonly protocol: string } }
    ))
  | { readonly step: 'unavailable'; readonly csrfToken?: string; readonly reason: FormalizationSignatureUnavailableReason; readonly result?: FormalizationSignatureResult; readonly retryAt?: Date }
export type FormalizationSignatureGatewayDocument = { readonly id: string; readonly title: string; readonly position: number; readonly pageCount?: number }
export const FormalizationSignatureUnavailableReason = {
  accessUnavailable: 'access_unavailable', noChannel: 'no_channel',
  otpInvalid: 'otp_invalid', otpLocked: 'otp_locked',
  documentUnavailable: 'document_unavailable', providerUnavailable: 'provider_unavailable',
  rejected: 'rejected', cancelled: 'cancelled', expired: 'expired',
} as const
export type FormalizationSignatureUnavailableReason = ValueOf<typeof FormalizationSignatureUnavailableReason>
export type FormalizationSignatureResult = { readonly status: FormalizationSignatureResultStatus; readonly hmsReference: string; readonly protocol?: string; readonly occurredAt?: Date; readonly confirmedAt?: Date }

// Core-owned REST port structures. Validation may infer structurally equivalent
// DTOs from Zod, but Core never imports @hms/validation.
export type ConfirmFormalizationSignatureSendingCommand = { readonly expectedVersion: number; readonly confirmationKey: string }
export type CancelFormalizationSignatureSendingCommand = { readonly expectedVersion: number }
export type ExchangeSignatureInvitationCommand = { readonly token: string }
export type RequestSignatureOtpCommand = { readonly channelChoiceId: string }
export type VerifySignatureOtpCommand = { readonly challengeId: string; readonly code: string }
export type AcknowledgeSignatureDocumentCommand = { readonly expectedRequestVersion: number; readonly acknowledged: true }
export type StartFormalizationSigningCommand = { readonly expectedRequestVersion: number }
export type FormalizationSignatureSendingReviewResponse = Omit<FormalizationSignatureSendingReview, 'status'> & { readonly status: FormalizationSignatureStatus }
export type FormalizationSignatureSendingStatusResponse = { readonly requestId: string; readonly status: FormalizationSignatureRequestStatus; readonly version: number; readonly totalDocuments: number; readonly completedDocuments: number; readonly failedDocuments: number; readonly canCancel: boolean; readonly canRetry: boolean }
export type FormalizationSignatureGatewayDocumentResponse = FormalizationSignatureGatewayDocument
export type FormalizationSignatureGatewayDocumentsResponse = {
  readonly documents: readonly FormalizationSignatureGatewayDocumentResponse[]
  readonly acknowledgedDocumentIds: readonly string[]
  readonly requestVersion: number
}
export type FormalizationSignatureDocumentAcknowledgementResponse = {
  readonly requestDocumentId: string
  readonly acknowledgedAt: string
}
export type FormalizationSignatureGatewayResultResponse = Omit<FormalizationSignatureResult, 'occurredAt' | 'confirmedAt'> & { readonly occurredAt?: string; readonly confirmedAt?: string }
export type FormalizationSignatureGatewayContextResponse =
  | ({ readonly csrfToken: string } & (
      | { readonly step: 'invitation' }
      | { readonly step: 'choose_channel'; readonly channels: FormalizationSignatureAuthenticationChannels }
      | { readonly step: 'enter_otp'; readonly challengeId: string; readonly expiresAt: string; readonly resendAvailableAt: string }
      | { readonly step: 'collaborator_login'; readonly loginPath: string }
      | { readonly step: 'reading'; readonly documents: readonly FormalizationSignatureGatewayDocumentResponse[]; readonly acknowledgedDocumentIds: readonly string[]; readonly requestVersion: number }
      | { readonly step: 'submitted'; readonly result: FormalizationSignatureGatewayResultResponse & { readonly status: FormalizationSignaturePendingResultStatus } }
      | { readonly step: 'confirmed'; readonly result: FormalizationSignatureGatewayResultResponse & { readonly status: typeof FormalizationSignatureResultStatus.confirmed; readonly protocol: string } }
    ))
  | { readonly step: 'unavailable'; readonly csrfToken?: string; readonly reason: FormalizationSignatureUnavailableReason; readonly result?: FormalizationSignatureGatewayResultResponse; readonly retryAt?: string }
```

## Integration events

Event schemas are versioned and registered with the shared messaging contract. Secret
payloads are encrypted before persistence; logging middleware sees only the redacted
envelope.

Formalization consumes Communication outcomes through two dedicated Inngest jobs with
stable IDs: `formalization/mark-signature-invitation-delivery` subscribes only to
`communication.signature-invitation-delivered.v1` and invokes
`MarkFormalizationSignatureInvitationDeliveryUseCase`; and
`formalization/mark-signature-otp-delivery` subscribes only to
`communication.signature-otp-delivered.v1` and invokes
`MarkSignatureOtpDeliveryUseCase`. Communication never calls Formalization use cases
directly. The scheduled reconcilers are separate triggers that only republish due work.

| Event | Payload |
| --- | --- |
| formalization.signature-request-provisioning-requested.v1 | requestId, provisioningAttemptId, occurredAt and correlationId. |
| formalization.signature-invitation-ready.v1 | deliveryAttemptId, invitationId, recipientId, personId, channel, encrypted HMS invitation delivery payload, cipher key ID, expiresAt and correlationId; no raw provider credential. |
| communication.signature-invitation-delivered.v1 | deliveryAttemptId, invitationId, Communication message ID, occurredAt and delivered/failed outcome; no token/contact/document title. |
| formalization.signature-request-cancellation-requested.v1 | requestId, cancellationAttemptId, occurredAt and correlationId. |
| formalization.signature-otp-delivery-requested.v1 | deliveryAttemptId, invitationId, channel, encrypted destination/code/template payload, cipher key ID, expiresAt and correlation ID. No plaintext destination or code. |
| communication.signature-otp-delivered.v1 | deliveryAttemptId, provider message ID, delivered-attempt time and outcome code; no contact or code. |
| formalization.signature-recipient-submitted.v1 | requestId, recipientId, completed assigned request-document IDs, provider observation ID and submittedAt. |
| formalization.signature-recipient-confirmed.v1 | formalizationId, requestId, recipientId, package protocol, confirmedAt and document-scoped artifact references/hashes. |
| formalization.signature-recipient-terminal.v1 | formalizationId, requestId, recipientId, rejected/cancelled/expired outcome and occurredAt. |
| formalization.signature-reconciliation-requested.v1 | requestId, reason code and earliestRunAt. |

Each row is one Core `Event<Payload>` class in
`packages/core/src/formalization/domain/events` (the Communication result class lives
under its owning module). The exact payload declarations are:

```ts
type FormalizationSignatureRequestProvisioningRequestedPayload = {
  readonly requestId: string
  readonly provisioningAttemptId: string; readonly occurredAt: Date; readonly correlationId: string
}
type FormalizationSignatureInvitationReadyPayload = {
  readonly deliveryAttemptId: string; readonly invitationId: string
  readonly recipientId: string; readonly personId: string
  readonly channel: FormalizationSignatureChannelKind; readonly encryptedPayload: string
  readonly cipherKeyId: string; readonly expiresAt: Date; readonly correlationId: string
}
type CommunicationSignatureInvitationDeliveredPayload = {
  readonly deliveryAttemptId: string; readonly invitationId: string
  readonly communicationMessageId?: string
  readonly occurredAt: Date; readonly outcome: 'delivered' | 'failed'
}
type FormalizationSignatureRequestCancellationRequestedPayload = {
  readonly requestId: string
  readonly cancellationAttemptId: string; readonly occurredAt: Date; readonly correlationId: string
}
type FormalizationSignatureOtpDeliveryRequestedPayload = {
  readonly deliveryAttemptId: string; readonly invitationId: string
  readonly channel: FormalizationSignatureChannelKind; readonly encryptedPayload: string
  readonly cipherKeyId: string; readonly expiresAt: Date; readonly correlationId: string
}
type CommunicationSignatureOtpDeliveredPayload = {
  readonly deliveryAttemptId: string; readonly providerMessageId?: string
  readonly occurredAt: Date; readonly outcome: 'delivered' | 'failed'
}
type FormalizationSignatureRecipientSubmittedPayload = {
  readonly requestId: string; readonly recipientId: string
  readonly requestDocumentIds: readonly string[]
  readonly providerObservationId: string; readonly submittedAt: Date
}
type FormalizationSignatureRecipientConfirmedPayload = {
  readonly formalizationId: string; readonly requestId: string; readonly recipientId: string
  readonly protocol: string; readonly confirmedAt: Date
  readonly artifacts: ReadonlyArray<{ readonly requestDocumentId?: string; readonly kind: FormalizationSignatureArtifactKind; readonly privateFileId: string; readonly sha256: string }>
}
type FormalizationSignatureRecipientTerminalPayload = {
  readonly formalizationId: string; readonly requestId: string; readonly recipientId: string
  readonly outcome: 'rejected' | 'cancelled' | 'expired'; readonly occurredAt: Date
}
type FormalizationSignatureReconciliationRequestedPayload = {
  readonly requestId: string; readonly reason: FormalizationSignatureReconciliationReason
  readonly earliestRunAt: Date
}
```

The corresponding classes are
`FormalizationSignatureRequestProvisioningRequestedEvent`,
`FormalizationSignatureInvitationReadyEvent`,
`CommunicationSignatureInvitationDeliveredEvent`,
`FormalizationSignatureRequestCancellationRequestedEvent`,
`FormalizationSignatureOtpDeliveryRequestedEvent`,
`CommunicationSignatureOtpDeliveredEvent`,
`FormalizationSignatureRecipientSubmittedEvent`,
`FormalizationSignatureRecipientConfirmedEvent`,
`FormalizationSignatureRecipientTerminalEvent` and
`FormalizationSignatureReconciliationRequestedEvent`; each exposes the matching
literal event name from the table and its exact payload through the existing shared
`Event` contract.

Communication adds an OTP delivery handler that decrypts only inside the job, calls the
the Resend-backed `EmailProvider` implementation, and zeroes/discards
plaintext references after the call. Retries reuse the same encrypted delivery
attempt; they do not create a new challenge or bypass rate limits. Provider error bodies
are classified and redacted before persistence.

## Stable error codes

Public REST mapping intentionally collapses several internal codes.

| Internal code | Public mapping |
| --- | --- |
| formalization_signature_not_ready, formalization_signature_stale_configuration | 409 with the current safe review/readiness projection. |
| formalization_signature_sending_forbidden | 403 through the authenticated Formalization REST boundary. |
| formalization_signature_request_conflict | 409 with the current request ID/status and no provider identifiers. |
| formalization_signature_provisioning_failed, formalization_signature_cancellation_partial | 202 with retryable request status for authorized internal users; provider details remain server-only. |
| signature_invitation_invalid, signature_invitation_expired, signature_invitation_consumed, signature_recipient_terminal | 404 gateway_access_unavailable |
| signature_channel_unavailable, signature_consent_missing | 409 gateway_channel_unavailable |
| signature_otp_invalid, signature_otp_expired, signature_otp_superseded, signature_otp_consumed | 422 gateway_otp_invalid |
| signature_otp_rate_limited, signature_otp_locked | 429 gateway_otp_temporarily_unavailable with Retry-After only for a known flow |
| signature_session_invalid, signature_device_mismatch, signature_csrf_invalid | 401 gateway_session_invalid and cookie clearing |
| signature_collaborator_ineligible, signature_collaborator_unassigned | 403 gateway_access_unavailable and revocation |
| signature_document_unavailable | 503 gateway_document_temporarily_unavailable |
| signature_provider_unavailable, signature_proxy_contract_violation | 503 gateway_provider_temporarily_unavailable; contract violation also pages operations |
| signature_reconciliation_required | 202 gateway_confirmation_pending |

Internal codes are exposed by these exact `AppError` subclasses, one per file under
`packages/core/src/formalization/domain/errors`:
`FormalizationSignatureNotReadyError`,
`FormalizationSignatureStaleConfigurationError`,
`FormalizationSignatureSendingForbiddenError`,
`FormalizationSignatureRequestConflictError`,
`FormalizationSignatureProvisioningFailedError`,
`FormalizationSignatureCancellationPartialError`, `SignatureInvitationInvalidError`,
`SignatureInvitationExpiredError`, `SignatureInvitationConsumedError`,
`SignatureRecipientTerminalError`, `SignatureChannelUnavailableError`,
`SignatureConsentMissingError`, `SignatureOtpInvalidError`, `SignatureOtpExpiredError`,
`SignatureOtpSupersededError`, `SignatureOtpConsumedError`,
`SignatureOtpRateLimitedError`, `SignatureOtpLockedError`,
`SignatureSessionInvalidError`, `SignatureDeviceMismatchError`,
`SignatureCsrfInvalidError`, `SignatureCollaboratorIneligibleError`,
`SignatureCollaboratorUnassignedError`, `SignatureDocumentUnavailableError`,
`SignatureProviderUnavailableError`, `SignatureProxyContractViolationError` and
`SignatureReconciliationRequiredError`. Each filename is the kebab-case class name plus
`.ts`; each constructor fixes the matching internal code and safe default message.

## Validation package

Create Formalization Gateway Zod schemas in packages/validation and import them from
Server and Web. Validation normalizes no secret except trimming surrounding accidental
whitespace on the fragment token before strict base64url decoding; OTP accepts exactly
six ASCII digits and never coerces a number.

Required schemas cover:

- send review response, confirmation and cancel-all commands;
- request/provisioning/cancellation status response;
- invitation exchange body and generic response;
- gateway context discriminated union by safe step;
- channel choice response and OTP request;
- OTP verification;
- per-document acknowledgement command and package-level start-signing command;
- safe result response and close command;
- webhook payload envelope for the pinned event set;
- internal integration-event versions;
- identifiers, expectedVersion and pagination/range constraints.

The schema and inferred-type file ledger is exact:

| Path | Exported declarations |
| --- | --- |
| `packages/validation/src/formalization/signing-gateway/formalization-signature-sending-schema.ts` | strict review, confirmation and request-status schemas; `ConfirmFormalizationSignatureSendingInput`, `CancelFormalizationSignatureSendingInput`, `FormalizationSignatureSendingReviewDto` and `FormalizationSignatureSendingStatusDto` inferred types |
| `packages/validation/src/formalization/signing-gateway/exchange-signature-invitation-schema.ts` | `exchangeSignatureInvitationSchema: z.strictObject({ token: z.string().trim().regex(BASE64URL_256_BIT_PATTERN) })`; `ExchangeSignatureInvitationInput = z.infer<typeof exchangeSignatureInvitationSchema>` |
| `packages/validation/src/formalization/signing-gateway/request-signature-otp-schema.ts` | `requestSignatureOtpSchema: z.strictObject({ channelChoiceId: z.string().uuid() })`; inferred `RequestSignatureOtpInput` |
| `packages/validation/src/formalization/signing-gateway/verify-signature-otp-schema.ts` | strict UUID `challengeId` plus `code: z.string().regex(/^[0-9]{6}$/)`; inferred `VerifySignatureOtpInput` |
| `packages/validation/src/formalization/signing-gateway/acknowledge-signature-document-schema.ts` | strict positive-integer `expectedRequestVersion` plus `acknowledged: z.literal(true)`, and strict acknowledgement response; inferred `AcknowledgeSignatureDocumentInput` and `SignatureDocumentAcknowledgementDto` |
| `packages/validation/src/formalization/signing-gateway/start-signing-schema.ts` | strict positive-integer `expectedRequestVersion`; inferred `StartSigningInput` |
| `packages/validation/src/formalization/signing-gateway/signature-gateway-context-schema.ts` | discriminated union matching every `FormalizationSignatureGatewayContext.step`; ISO datetime serialization; inferred `SignatureGatewayContextDto` |
| `packages/validation/src/formalization/signing-gateway/signature-gateway-document-schema.ts` | strict `id`, `title`, nonnegative `position`, optional positive `pageCount`; inferred `SignatureGatewayDocumentDto` |
| `packages/validation/src/formalization/signing-gateway/signature-gateway-documents-schema.ts` | strict ordered documents, acknowledged UUIDs and positive request version; inferred `SignatureGatewayDocumentsDto` |
| `packages/validation/src/formalization/signing-gateway/signature-result-schema.ts` | strict safe result fields and submitted/confirmed/rejected/cancelled/expired status; inferred `SignatureResultDto` |
| `packages/validation/src/formalization/signing-gateway/documenso-webhook-schema.ts` | strict pinned event envelope with provider event/envelope/recipient IDs and event timestamp; inferred `DocumensoWebhookInput` |
| `packages/validation/src/formalization/signing-gateway/signature-gateway-event-schemas.ts` | one strict versioned payload schema for each event declared below; inferred payload types use the Event class names plus `Payload` |
| `packages/validation/src/formalization/signing-gateway/index.ts` | explicit exports for every declaration above |
| `packages/validation/src/formalization/index.ts` | re-export the signing-gateway barrel |

The declarations above expand exactly to these Zod shapes; all objects are strict:

```ts
const uuid = z.string().uuid()
const isoDatetime = z.string().datetime({ offset: true })
const channel = z.object({ id: uuid, kind: z.enum(FormalizationSignatureChannelKind), maskedDestination: z.string().min(3).max(320) }).strict()
const requestStatus = z.enum(FormalizationSignatureRequestStatus)
export const confirmFormalizationSignatureSendingSchema = z.object({ expectedVersion: z.number().int().positive(), confirmationKey: uuid }).strict()
export const cancelFormalizationSignatureSendingSchema = z.object({ expectedVersion: z.number().int().positive() }).strict()
export const formalizationSignatureSendingReviewSchema = z.object({ formalizationId: uuid, version: z.number().int().positive(), status: z.enum(FormalizationSignatureStatus), ready: z.boolean(), documents: z.array(z.object({ id: uuid, title: z.string().min(1).max(255), position: z.number().int().nonnegative(), pageCount: z.number().int().positive(), unsignedSha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict()).readonly(), signatories: z.array(z.object({ id: uuid, displayName: z.string().min(1).max(255), actorKind: z.enum(FormalizationSignatureRecipientKind), deliveryChannel: z.enum(FormalizationSignatureChannelKind), documentIds: z.array(uuid).min(1).readonly() }).strict()).readonly(), messagePreview: z.string().min(1).max(1000), issues: z.array(z.object({ code: z.enum(FormalizationSignatureSendingIssueCode), documentId: uuid.optional(), signatoryId: uuid.optional() }).strict()).readonly(), currentRequest: z.object({ id: uuid, status: requestStatus, version: z.number().int().positive(), openDocuments: z.number().int().nonnegative(), totalDocuments: z.number().int().positive() }).strict().optional() }).strict()
export const formalizationSignatureSendingStatusSchema = z.object({ requestId: uuid, status: requestStatus, version: z.number().int().positive(), totalDocuments: z.number().int().positive(), completedDocuments: z.number().int().nonnegative(), failedDocuments: z.number().int().nonnegative(), canCancel: z.boolean(), canRetry: z.boolean() }).strict()
export const requestSignatureOtpSchema = z.object({ channelChoiceId: uuid }).strict()
export const verifySignatureOtpSchema = z.object({ challengeId: uuid, code: z.string().regex(/^[0-9]{6}$/) }).strict()
export const acknowledgeSignatureDocumentSchema = z.object({ expectedRequestVersion: z.number().int().positive(), acknowledged: z.literal(true) }).strict()
export const signatureDocumentAcknowledgementSchema = z.object({ requestDocumentId: uuid, acknowledgedAt: isoDatetime }).strict()
export const startSigningSchema = z.object({ expectedRequestVersion: z.number().int().positive() }).strict()
export const signatureGatewayDocumentSchema = z.object({ id: uuid, title: z.string().min(1).max(255), position: z.number().int().nonnegative(), pageCount: z.number().int().positive().optional() }).strict()
export const signatureGatewayDocumentsSchema = z.object({ documents: z.array(signatureGatewayDocumentSchema).min(1).readonly(), acknowledgedDocumentIds: z.array(uuid).readonly(), requestVersion: z.number().int().positive() }).strict()
export const signatureResultSchema = z.object({ status: z.enum(FormalizationSignatureResultStatus), hmsReference: z.string().min(1).max(64), protocol: z.string().min(1).max(128).optional(), occurredAt: isoDatetime.optional(), confirmedAt: isoDatetime.optional() }).strict()
const contextCsrf = { csrfToken: z.string().regex(BASE64URL_256_BIT_PATTERN) }
export const signatureGatewayContextSchema = z.discriminatedUnion('step', [
  z.object({ ...contextCsrf, step: z.literal('invitation') }).strict(),
  z.object({ ...contextCsrf, step: z.literal('choose_channel'), channels: z.union([z.tuple([]), z.tuple([channel])]) }).strict(),
  z.object({ ...contextCsrf, step: z.literal('enter_otp'), challengeId: uuid, expiresAt: isoDatetime, resendAvailableAt: isoDatetime }).strict(),
  z.object({ ...contextCsrf, step: z.literal('collaborator_login'), loginPath: z.string().startsWith('/login?returnTo=') }).strict(),
  z.object({ ...contextCsrf, step: z.literal('reading'), documents: z.array(signatureGatewayDocumentSchema).min(1).readonly(), acknowledgedDocumentIds: z.array(uuid).readonly(), requestVersion: z.number().int().positive() }).strict(),
  z.object({ ...contextCsrf, step: z.literal('submitted'), result: signatureResultSchema.extend({ status: z.enum(FormalizationSignaturePendingResultStatus) }) }).strict(),
  z.object({ ...contextCsrf, step: z.literal('confirmed'), result: signatureResultSchema.extend({ status: z.literal(FormalizationSignatureResultStatus.confirmed), protocol: z.string().min(1).max(128) }) }).strict(),
  z.object({ step: z.literal('unavailable'), csrfToken: contextCsrf.csrfToken.optional(), reason: z.enum(FormalizationSignatureUnavailableReason), result: signatureResultSchema.optional(), retryAt: isoDatetime.optional() }).strict(),
])
export const documensoWebhookSchema = z.object({ id: z.string().min(1).max(255), event: z.string().min(1).max(128), createdAt: isoDatetime, payload: z.object({ envelopeId: z.string().min(1).max(255), recipientId: z.string().min(1).max(255).optional(), envelopeItemId: z.string().min(1).max(255).optional() }).strict() }).strict()
export const formalizationSignatureRequestProvisioningRequestedEventSchema = z.object({ version: z.literal(1), requestId: uuid, provisioningAttemptId: uuid, occurredAt: isoDatetime, correlationId: uuid }).strict()
export const formalizationSignatureInvitationReadyEventSchema = z.object({ version: z.literal(1), deliveryAttemptId: uuid, invitationId: uuid, recipientId: uuid, personId: uuid, channel: z.enum(FormalizationSignatureChannelKind), encryptedPayload: z.string().min(1), cipherKeyId: z.string().min(1).max(128), expiresAt: isoDatetime, correlationId: uuid }).strict()
export const communicationSignatureInvitationDeliveredEventSchema = z.object({ version: z.literal(1), deliveryAttemptId: uuid, invitationId: uuid, communicationMessageId: z.string().min(1).max(255).optional(), occurredAt: isoDatetime, outcome: z.enum(['delivered', 'failed']) }).strict()
export const formalizationSignatureRequestCancellationRequestedEventSchema = z.object({ version: z.literal(1), requestId: uuid, cancellationAttemptId: uuid, occurredAt: isoDatetime, correlationId: uuid }).strict()
export const formalizationSignatureOtpDeliveryRequestedEventSchema = z.object({ version: z.literal(1), deliveryAttemptId: uuid, invitationId: uuid, channel: z.enum(FormalizationSignatureChannelKind), encryptedPayload: z.string().min(1), cipherKeyId: z.string().min(1).max(128), expiresAt: isoDatetime, correlationId: uuid }).strict()
export const communicationSignatureOtpDeliveredEventSchema = z.object({ version: z.literal(1), deliveryAttemptId: uuid, providerMessageId: z.string().min(1).max(255).optional(), occurredAt: isoDatetime, outcome: z.enum(['delivered', 'failed']) }).strict()
export const formalizationSignatureRecipientSubmittedEventSchema = z.object({ version: z.literal(1), requestId: uuid, recipientId: uuid, requestDocumentIds: z.array(uuid).min(1).readonly(), providerObservationId: z.string().min(1).max(255), submittedAt: isoDatetime }).strict()
export const formalizationSignatureRecipientConfirmedEventSchema = z.object({ version: z.literal(1), formalizationId: uuid, requestId: uuid, recipientId: uuid, protocol: z.string().min(1).max(128), confirmedAt: isoDatetime, artifacts: z.array(z.object({ requestDocumentId: uuid.optional(), kind: z.enum(FormalizationSignatureArtifactKind), privateFileId: uuid, sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict()).min(1).readonly() }).strict()
export const formalizationSignatureRecipientTerminalEventSchema = z.object({ version: z.literal(1), formalizationId: uuid, requestId: uuid, recipientId: uuid, outcome: z.enum(['rejected', 'cancelled', 'expired']), occurredAt: isoDatetime }).strict()
export const formalizationSignatureReconciliationRequestedEventSchema = z.object({ version: z.literal(1), requestId: uuid, reason: z.enum(FormalizationSignatureReconciliationReason), earliestRunAt: isoDatetime }).strict()
export type RequestSignatureOtpInput = z.infer<typeof requestSignatureOtpSchema>
export type ConfirmFormalizationSignatureSendingInput = z.infer<typeof confirmFormalizationSignatureSendingSchema>
export type CancelFormalizationSignatureSendingInput = z.infer<typeof cancelFormalizationSignatureSendingSchema>
export type FormalizationSignatureSendingReviewDto = z.infer<typeof formalizationSignatureSendingReviewSchema>
export type FormalizationSignatureSendingStatusDto = z.infer<typeof formalizationSignatureSendingStatusSchema>
export type VerifySignatureOtpInput = z.infer<typeof verifySignatureOtpSchema>
export type AcknowledgeSignatureDocumentInput = z.infer<typeof acknowledgeSignatureDocumentSchema>
export type SignatureDocumentAcknowledgementDto = z.infer<typeof signatureDocumentAcknowledgementSchema>
export type StartSigningInput = z.infer<typeof startSigningSchema>
export type SignatureGatewayDocumentDto = z.infer<typeof signatureGatewayDocumentSchema>
export type SignatureGatewayDocumentsDto = z.infer<typeof signatureGatewayDocumentsSchema>
export type SignatureResultDto = z.infer<typeof signatureResultSchema>
export type SignatureGatewayContextDto = z.infer<typeof signatureGatewayContextSchema>
export type DocumensoWebhookInput = z.infer<typeof documensoWebhookSchema>
export type FormalizationSignatureRequestProvisioningRequestedEventInput = z.infer<typeof formalizationSignatureRequestProvisioningRequestedEventSchema>
export type FormalizationSignatureInvitationReadyEventInput = z.infer<typeof formalizationSignatureInvitationReadyEventSchema>
export type CommunicationSignatureInvitationDeliveredEventInput = z.infer<typeof communicationSignatureInvitationDeliveredEventSchema>
export type FormalizationSignatureRequestCancellationRequestedEventInput = z.infer<typeof formalizationSignatureRequestCancellationRequestedEventSchema>
export type FormalizationSignatureOtpDeliveryRequestedEventInput = z.infer<typeof formalizationSignatureOtpDeliveryRequestedEventSchema>
export type CommunicationSignatureOtpDeliveredEventInput = z.infer<typeof communicationSignatureOtpDeliveredEventSchema>
export type FormalizationSignatureRecipientSubmittedEventInput = z.infer<typeof formalizationSignatureRecipientSubmittedEventSchema>
export type FormalizationSignatureRecipientConfirmedEventInput = z.infer<typeof formalizationSignatureRecipientConfirmedEventSchema>
export type FormalizationSignatureRecipientTerminalEventInput = z.infer<typeof formalizationSignatureRecipientTerminalEventSchema>
export type FormalizationSignatureReconciliationRequestedEventInput = z.infer<typeof formalizationSignatureReconciliationRequestedEventSchema>
```

The schemas must not export raw provider token, `signingUrl`, contact destination or
cookie fields. Server controller and Web service tests assert unknown-key rejection and
the absence of those keys; the Validation package itself receives no test files.
Every closed set owned by Core in the compact schemas above is implemented as
`z.enum(CoreCanonicalStructure)` (request/document/recipient/invitation/session/artifact
statuses, actor/channel kinds, reconciliation and unavailable reasons), never by
repeating its string literals in Validation. Only transport-only discriminators such as
event `version` and HTTP outcome names remain literal. Validation-inferred types are
adapter-local checks and are not imported by Core ports.

## Persistence and transaction contract

## Request-side tables added by SCRUM-140

The current checkout has none of these tables. Revision 4 creates them in the same
Formalization migration series and maps them to the exact Core entities above:

| Table | Required existing/added fields and constraints |
| --- | --- |
| formalizations | Add nullable `signature_request_id` UUID FK signature requests RESTRICT, `signature_status` request-status enum, and `signature_submitted_at`/`signature_confirmed_at`/`signature_terminal_at` timestamptz. Mapper and persistence types expose the corresponding optional domain fields. Updates are tenant-qualified, version-checked and derived inside the owning signature transaction. There is no `signature_terminal_status` column. |
| formalization_signature_snapshots | `id` UUID PK; `formalization_id` UUID FK Formalizations RESTRICT NOT NULL; `formalization_version`/`signature_configuration_version` integer >0 NOT NULL; `snapshot_hash` bytea length 32 UNIQUE NOT NULL; `created_by` UUID NOT NULL; `created_at` timestamptz NOT NULL. Unique `(formalization_id,signature_configuration_version)`; immutable after insert. Request documents/recipients are the normalized immutable snapshot details and CPF is never copied. |
| formalization_signature_requests | `id` UUID PK; `formalization_id` UUID FK Formalizations RESTRICT NOT NULL; `signature_configuration_version` integer NOT NULL CHECK >0; `snapshot_id` UUID FK snapshots RESTRICT NOT NULL UNIQUE; `confirmation_key_hash` bytea NOT NULL UNIQUE CHECK octet_length=32; `status` request-status enum NOT NULL; `version` integer NOT NULL DEFAULT 1 CHECK >0; `created_by` UUID NOT NULL; `created_at`/`updated_at` timestamptz NOT NULL; `sent_at`/`submitted_at`/`confirmed_at`/`terminal_at`/`cancellation_requested_at` nullable timestamptz. Unique `(id,snapshot_id)`, `(formalization_id,signature_configuration_version)` and partial unique `formalization_id` for non-terminal statuses. No provider envelope column. |
| formalization_signature_request_documents | `id` UUID PK; `request_id` UUID FK requests RESTRICT NOT NULL; `source_document_id`/`source_document_version_id`/`signature_preview_id`/`unsigned_private_file_id` UUID NOT NULL; `unsigned_sha256` bytea NOT NULL CHECK octet_length=32; `byte_count` bigint NOT NULL CHECK >0; `page_count` integer NOT NULL CHECK >0; `position` integer NOT NULL CHECK >=0; `status` request-document-status enum NOT NULL; `version` integer NOT NULL DEFAULT 1 CHECK >0; `provisioned_at`/`submitted_at`/`confirmed_at`/`terminal_at` nullable timestamptz; `created_at`/`updated_at` timestamptz NOT NULL. Unique `(request_id,id)`, `(request_id,source_document_version_id)` and `(request_id,position)`; index `(request_id,status)`. No provider identifier. |
| formalization_signature_recipients | `id` UUID PK; `request_id` UUID FK requests RESTRICT NOT NULL; `signatory_id` UUID FK signatories RESTRICT NOT NULL; `person_id` UUID NOT NULL as a reference-only identity; `actor_kind` enum NOT NULL; `display_name_snapshot` varchar NOT NULL; `delivery_channel` varchar NOT NULL CHECK = `email`; `status` recipient-status enum NOT NULL; `submission_observation_id` bytea NULL CHECK octet_length=32; `version` integer NOT NULL DEFAULT 1 CHECK >0; `invited_at`/`submitted_at`/`confirmed_at`/`terminal_at` nullable timestamptz; `created_at`/`updated_at` timestamptz NOT NULL. Unique `(request_id,id)`, `(request_id,signatory_id)` and partial unique `submission_observation_id` when non-null; indexes `(request_id,status)` and `(person_id,status)`. `submission_observation_id` is the purpose-separated SHA-256 of the HMS binding proof, not a provider identifier. The recipient model, persistence type and mapper convert it losslessly between Core's opaque lowercase-hex string and 32-byte storage. A future WhatsApp revision must expand the delivery constraint and migration explicitly. |
| formalization_signature_recipient_documents | `id` UUID PK; `request_id` UUID FK requests RESTRICT NOT NULL; `recipient_id` UUID NOT NULL; `request_document_id` UUID NOT NULL; `created_at` timestamptz NOT NULL. Unique `(recipient_id,request_document_id)`; composite FK `(request_id,recipient_id)` to recipients `(request_id,id)` RESTRICT and `(request_id,request_document_id)` to request_documents `(request_id,id)` RESTRICT; indexes `(request_id,recipient_id)` and `(request_document_id,recipient_id)`. Immutable assignment snapshot. |
| formalization_signature_invitations | `id` UUID PK; `request_id` UUID FK requests RESTRICT NOT NULL; `recipient_id` UUID NOT NULL; `generation` integer NOT NULL CHECK >0; `token_hash` bytea NOT NULL UNIQUE CHECK octet_length=32; `status` invitation-status enum NOT NULL; `delivery_status` enum pending/delivered/failed NOT NULL; `communication_message_id` varchar NULL; `expires_at` timestamptz NOT NULL; `delivered_at`/`consumed_at`/`revoked_at` nullable timestamptz; `revocation_reason` varchar NULL; `created_at` timestamptz NOT NULL. Composite FK `(request_id,recipient_id)` to recipients `(request_id,id)` RESTRICT; unique `(recipient_id,generation)` and partial unique recipient for active status; indexes `(request_id,status)`, `(delivery_status)` and `(expires_at,status)`. |
| formalization_signature_invitation_send_attempts | `id` UUID PK; `invitation_id` UUID FK invitations RESTRICT NOT NULL UNIQUE; `encrypted_payload` bytea NOT NULL; `cipher_key_id` varchar NOT NULL; `status` enum pending/delivered/failed NOT NULL; `communication_message_id` varchar NULL; `attempts` integer NOT NULL DEFAULT 0 CHECK >=0; `next_attempt_at`/`delivered_at` nullable timestamptz; `created_at`/`updated_at` timestamptz NOT NULL. Index `(status,next_attempt_at)`. The encrypted payload is retained only for the bounded delivery retry window. |
| formalization_signature_provider_resources | `id` UUID PK; `request_id` UUID FK requests RESTRICT NOT NULL UNIQUE; `provider` enum NOT NULL CHECK = `documenso`; `provider_contract_version` varchar NOT NULL; `provider_envelope_id`/`provider_external_id`/`idempotency_key` varchar NOT NULL UNIQUE; `last_reconciled_at` nullable timestamptz; `created_at` timestamptz NOT NULL. Unique `(request_id,id)`. No raw URL/token column. |
| formalization_signature_provider_document_resources | `id` UUID PK; `request_id` UUID FK requests RESTRICT NOT NULL; `provider_resource_id` UUID NOT NULL; `request_document_id` UUID NOT NULL UNIQUE; `provider_envelope_item_id` varchar NOT NULL UNIQUE; `created_at` timestamptz NOT NULL. Composite FK `(request_id,provider_resource_id)` to provider_resources `(request_id,id)` RESTRICT and `(request_id,request_document_id)` to request_documents `(request_id,id)` RESTRICT; unique `(provider_resource_id,provider_envelope_item_id)`. This is the only provider-item-to-request-document mapping. |
| formalization_signature_provider_recipient_resources | `id` UUID PK; `request_id` UUID FK requests RESTRICT NOT NULL; `provider_resource_id` UUID NOT NULL; `recipient_id` UUID NOT NULL UNIQUE; `provider_recipient_id` varchar NOT NULL UNIQUE; `encrypted_signing_credential` bytea NOT NULL; `cipher_key_id` varchar NOT NULL; `last_reconciled_at` nullable timestamptz; `created_at` timestamptz NOT NULL. Composite FK `(request_id,provider_resource_id)` to provider_resources `(request_id,id)` RESTRICT and `(request_id,recipient_id)` to recipients `(request_id,id)` RESTRICT; unique `(provider_resource_id,provider_recipient_id)`. All recipient-provider mappings remain outside the request aggregate. |
| formalization_signature_provisioning_attempts | `id` UUID PK; `request_id` UUID FK requests RESTRICT NOT NULL UNIQUE; `attempt_token` UUID NOT NULL; `status` enum pending/processing/provisioned/reconciliation_required/failed NOT NULL; `attempts` integer NOT NULL DEFAULT 0 CHECK >=0; `lease_expires_at`/`next_attempt_at` nullable timestamptz; `last_failure_code` varchar NULL; `created_at`/`updated_at` timestamptz NOT NULL. Index `(status,next_attempt_at)` and `lease_expires_at`. |
| formalization_signature_cancellation_attempts | `id` UUID PK; `request_id` UUID FK requests RESTRICT NOT NULL UNIQUE; `attempt_token` UUID NOT NULL; `status` enum pending/processing/cancelled/failed NOT NULL; `attempts` integer NOT NULL DEFAULT 0 CHECK >=0; `requested_by` UUID NOT NULL; `requested_at` timestamptz NOT NULL; `lease_expires_at`/`next_attempt_at` nullable timestamptz; `last_failure_code` varchar NULL; `updated_at` timestamptz NOT NULL. Index `(status,next_attempt_at)` and `lease_expires_at`. |

No migration may introduce a plaintext invitation, provider token or reversible link
column. Communication receives the raw HMS invitation only inside the encrypted,
single-purpose event payload and sends the fragment URL once.

## New Gateway tables

| Table | Columns and constraints |
| --- | --- |
| formalization_signature_otp_guards | invitation_id UUID PK/FK invitations(id) ON DELETE CASCADE NOT NULL; failed_attempts smallint NOT NULL DEFAULT 0 CHECK 0..5; rolling_window_started_at timestamptz NOT NULL; sends_in_window smallint NOT NULL DEFAULT 0 CHECK >=0; last_sent_at timestamptz NULL; locked_until timestamptz NULL; updated_at timestamptz NOT NULL; version integer NOT NULL DEFAULT 1 CHECK >0. |
| formalization_signature_otp_challenges | id UUID PK; invitation_id UUID FK invitations(id) ON DELETE CASCADE NOT NULL; generation integer NOT NULL CHECK >0; code_mac bytea NOT NULL CHECK octet_length=32; channel_choice_id UUID NOT NULL; destination_fingerprint bytea NOT NULL CHECK octet_length=32; status enum pending_delivery/active/consumed/superseded/expired/delivery_failed NOT NULL; failed_attempts smallint NOT NULL DEFAULT 0 CHECK 0..5; issued_at timestamptz NOT NULL; sent_at/expires_at/consumed_at timestamptz NULL. Unique(invitation_id,generation); partial unique invitation_id WHERE status IN pending_delivery,active; index invitation_id/status. |
| formalization_signature_otp_send_attempts | id UUID PK; challenge_id UUID FK challenges(id) ON DELETE CASCADE NOT NULL UNIQUE; encrypted_payload bytea NOT NULL; cipher_key_id varchar NOT NULL; status enum pending/delivered/failed NOT NULL; provider_message_id varchar NULL; attempts integer NOT NULL DEFAULT 0 CHECK >=0; next_attempt_at/delivered_at timestamptz NULL; created_at/updated_at timestamptz NOT NULL. Index(status,next_attempt_at). |
| formalization_signature_otp_rate_reservations | id UUID PK; invitation_id UUID FK invitations(id) ON DELETE CASCADE NOT NULL; source_ip_hash bytea NOT NULL CHECK octet_length=32; reserved_at timestamptz NOT NULL. Index(invitation_id,reserved_at); index(source_ip_hash,reserved_at). Retain only the approved abuse/audit window. |
| formalization_signature_gateway_sessions | id UUID PK; request_id UUID FK requests RESTRICT NOT NULL; recipient_id UUID NOT NULL; snapshot_id UUID NOT NULL; kind enum flow/authenticated/result NOT NULL; token_hash/device_secret_hash/csrf_hash bytea NOT NULL CHECK octet_length=32; token_hash UNIQUE; status enum active/revoked/expired NOT NULL; issued_at/expires_at timestamptz NOT NULL; revoked_at timestamptz NULL; revocation_reason varchar NULL; version integer NOT NULL DEFAULT 1 CHECK >0. Composite FK `(request_id,recipient_id)` to recipients `(request_id,id)` RESTRICT and `(request_id,snapshot_id)` to requests `(id,snapshot_id)` RESTRICT; unique `(id,request_id,recipient_id)`; partial unique(recipient_id,device_secret_hash) WHERE status=active AND kind=authenticated; indexes `(recipient_id,status)` and `(expires_at,status)`. Every session authorizes exactly one immutable request package. |
| formalization_signature_document_acknowledgements | id UUID PK; request_id/request_document_id/recipient_id/snapshot_id/session_id UUID NOT NULL; acknowledged_at timestamptz NOT NULL; source_ip_hash/user_agent_hash bytea NULL CHECK null or octet_length=32; created_at timestamptz NOT NULL. Composite FKs enforce `(request_id,recipient_id)`, `(request_id,request_document_id)` and `(request_id,snapshot_id)` ownership; composite FK `(session_id,request_id,recipient_id)` references sessions `(id,request_id,recipient_id)` RESTRICT. Unique `(recipient_id,request_document_id,snapshot_id)`; index `(recipient_id,snapshot_id)`. Immutable and append-once for the snapshot. |
| formalization_signature_proxy_bindings | id UUID PK; session_id UUID FK sessions(id) ON DELETE CASCADE NOT NULL; request_id UUID FK requests RESTRICT NOT NULL; recipient_id UUID NOT NULL; alias_hash bytea UNIQUE NOT NULL CHECK octet_length=32; encrypted_provider_credential bytea NOT NULL; cipher_key_id/provider_contract_version varchar NOT NULL; status enum active/revoked/expired NOT NULL; expires_at timestamptz NOT NULL; revoked_at timestamptz NULL; revocation_reason varchar NULL. Composite FK `(request_id,recipient_id)` to recipients `(request_id,id)` RESTRICT and transaction validation that session/request/recipient are identical; indexes `(recipient_id,status)` and `(expires_at,status)`. The alias plaintext is returned once and never persisted. |
| formalization_signature_webhook_receipts | id UUID PK; dedupe_key bytea UNIQUE NOT NULL CHECK octet_length=32; hint_kind enum observation/reconciliation_only NOT NULL; encrypted_hint bytea/cipher_key_id varchar NOT NULL; status enum pending/processing/processed/failed NOT NULL; received_at timestamptz NOT NULL; claim_token varchar NULL; lease_until/next_attempt_at/processed_at timestamptz NULL; attempts integer NOT NULL DEFAULT 0 CHECK >=0. No raw provider event name, ID or payload column exists. `processing` requires a non-null claim token and expiry; all other statuses clear both. Index(status,next_attempt_at) and lease_until. |
| formalization_signature_artifacts | id UUID PK; request_id UUID FK requests(id) ON DELETE RESTRICT NOT NULL; request_document_id UUID NULL; kind enum signed_pdf/provider_certificate/provider_evidence NOT NULL; private_file_id UUID NOT NULL; sha256 bytea NOT NULL CHECK octet_length=32; byte_count bigint NOT NULL CHECK >0; media_type varchar NOT NULL; provider_reference varchar NULL; preserved_at timestamptz NOT NULL. Composite FK `(request_id,request_document_id)` to request_documents `(request_id,id)` RESTRICT when document ID is present. Partial unique `(request_document_id,kind)` where request_document_id is not null and partial unique `(request_id,kind)` where request_document_id is null. CHECK requires `signed_pdf` to have a document ID and request-scoped certificate/evidence to omit it. |
| formalization_signature_protocols | id UUID PK; request_id UUID FK requests(id) ON DELETE RESTRICT NOT NULL; recipient_id UUID NOT NULL; number varchar NOT NULL UNIQUE; artifact_set_hash bytea NOT NULL CHECK octet_length=32; confirmed_at/created_at timestamptz NOT NULL. Composite FK `(request_id,recipient_id)` to recipients `(request_id,id)` RESTRICT; unique(recipient_id,request_id); immutable after insert. |
| formalization_signature_audit_entries | id UUID PK; request_id/recipient_id/invitation_id/session_id UUID NULL with ON DELETE SET NULL FKs; action varchar NOT NULL; actor_kind enum client/collaborator NULL; actor_reference varchar NULL; occurred_at timestamptz NOT NULL; correlation_id UUID NOT NULL; source_ip_hash/user_agent_hash bytea NULL CHECK null or octet_length=32; metadata jsonb NOT NULL DEFAULT '{}' CHECK jsonb_typeof='object'. Index(request_id,occurred_at), recipient_id/occurred_at and correlation_id. No secret/contact/provider payload fields. |

Drizzle enums and relations live with the Formalization database models and are
exported through the central schema. Every FK has an explicit delete policy: business
records/artifacts/protocols restrict or retain; ephemeral challenges/sessions/bindings
cascade only when their parent invitation/request is lawfully purged. Production
retention must be documented; no broad cascade may erase signed evidence.

## Concurrency and transactional algorithms

### Send confirmation and provisioning

1. The review use case loads the Formalization, configuration, previews, fields and
   live Identity/Communication projections and returns no raw contacts.
2. Confirmation hashes the client-generated UUID confirmation key, revalidates actor,
   Formalization/configuration versions and every readiness invariant, constructs all
   request/document/package-recipient/recipient-document/provisioning records, and calls
   `confirmSending` once.
3. The transaction locks the Formalization/configuration rows, rejects stale state,
   returns the existing request for the same confirmation hash, inserts the complete
   graph and locks editing atomically. It performs no network call.
4. After commit, one request-level provisioning event is published. A bounded reconciler
   republishes only pending or lease-expired attempts; this is a domain work ledger,
   not a generic outbox.
5. The provisioning use case claims the request attempt by attempt token, checks for a
   stored provider resource, and otherwise calls `findEnvelopeByExternalId` before
   `createEnvelope`. It uploads every immutable PDF in authoritative order with
   `distribution: 'none'`, maps each field through its request-document external ID,
   verifies every returned envelope-item mapping, distributes with native messages
   disabled, encrypts recipient credentials, and stores envelope, item and recipient
   mappings before creating invitations.
6. Invitation creation, its encrypted bounded send-attempt ledger row and the
   recipient/request projection update commit together. Raw invitation tokens exist
   only in memory long enough to encrypt that ledger payload. After commit the
   invitation-ready event identifies the same attempt; the delivery reconciler
   republishes pending/due attempts without minting a new token. Ambiguous provider
   outcomes become `reconciliation_required`; retries never issue a second external ID.

### Cancel all sends

1. The use case locks the request graph, revokes active invitation/session/binding rows
   immediately, records the actor/time and inserts one request-level cancellation
   attempt in one commit.
2. The cancellation job claims that attempt, calls provider cancellation only when the
   shared provider resource exists, treats already-terminal as success, and never
   rewrites a confirmed/rejected terminal outcome to cancelled.
3. The request remains `reconciliation_required` while the attempt fails or provider
   truth is ambiguous. Editing unlocks only after the shared envelope and every request
   document are terminal. Retrying reuses the same attempt/external resource.

### Invitation exchange

1. Hash the decoded 256-bit token before querying.
2. SELECT the invitation for update by token_hash and load recipient/request state.
3. Reject generically unless active, unexpired and non-terminal.
4. Consume the invitation token, revoke older flow sessions and insert one flow
   session/device/CSRF hash set.
5. Commit, then set opaque cookies and return only CSRF plus next-step metadata.

Two exchanges racing on the same token yield exactly one commit. Database unique
constraints are the final guard; in-memory locks are insufficient.

### OTP issue

1. The use case resolves the live consented Identity destination and opaque choice,
   reads guard/reservation counts and decides cooldown, rolling-window and lock policy.
2. For an allowed request it constructs the exact guard, supersession, challenge,
   rate-reservation and encrypted-delivery mutations before calling the transaction.
3. The adapter locks invitation/guard plus stable invitation/IP advisory keys, rechecks
   expected versions/count snapshots and either applies those mutations atomically or
   returns `conflict`; it never returns a business `rate_limited` outcome.
4. The decided mutation supersedes the prior active/pending challenge, reserves the rate slot, generates the
   code, store its purpose-bound MAC, encrypt one delivery payload and insert the
   bounded OTP send-attempt ledger row in the same commit. Publish directly after
   commit; reconcile pending attempts without introducing a generic outbox.
5. The Communication result marks the challenge active and starts its 30-minute
   validity from successful send. A failed send never becomes verifiable but still
   consumes the anti-abuse reservation.

### OTP verification

The use case reads the invitation, guard and newest challenge, rejects a current lock,
computes the expected MAC and compares equal-length bytes in constant time. It decides
the exact failure increment/lock or success consumption/session-rotation mutations.
The transaction adapter locks those same rows and applies the supplied mutations only
when their expected versions/current IDs still match; otherwise it returns `conflict`
for use-case retry. A used or superseded challenge never increments an unrelated
current challenge.

### Submission and confirmation

The submission use case identifies the exact active, unexpired, device-bound authenticated
session and matching request/recipient/binding from the classified proxy mutation, computes
the deterministic purpose-separated HMS observation ID from the binding ID and calls
`recordSubmission` without generating replacement secrets. That transaction locks
recipient/request/Formalization plus every active invitation, session and binding for the
recipient, records the normalized HMS observation ID, applies submitted if monotonic, converts
the presenting session in place to result-only, revokes every other signing access row and
derives the aggregate projection in one commit. Conflict throws; `duplicate` is a successful
no-op only when the same session is already result-only and the same binding/observation proof
matches the submitted recipient. The
unchanged opaque cookie survives a lost response but no longer authorizes documents or the
provider. Confirmation uses
a job lease plus provider idempotency key, stores downloaded bytes in private storage,
verifies hashes/media types, inserts artifacts and protocol, then commits recipient,
request and Formalization projection together. Storage writes that precede a failed
database commit are recoverable orphans scheduled for cleanup; database confirmation
never points at missing bytes.

### Document reading and provider entry

1. An authenticated package session lists every immutable request document in
   authoritative order. A content request includes one request-document ID and is
   accepted only when it belongs to that session request and unchanged snapshot.
2. Acknowledgement locks the package session and request version, rejects an expired session,
   verifies membership and, for a collaborator, resolves the exact source person plus one of
   the permitted current roles and current request assignment. It then inserts one immutable
   `(recipient, requestDocument, snapshot)` row. Replays for the same snapshot are successful
   no-ops; a changed snapshot, wrong source person/role/assignment or stale request is a
   conflict/unavailable outcome.
3. Starting signing revalidates eligibility, request version and the complete document
   set. It refuses provider entry unless an acknowledgement exists for every request
   document. With no active binding it prepares the provider credential and calls
   `startProviderEntry(create)`; with exactly one matching active binding it calls
   `startProviderEntry(rotate)` with a fresh alias hash and reuses the encrypted credential.
   The previous alias becomes invalid at commit. A committed response lost to the network is
   therefore recoverable by repeating the same explicit start action. Multiple, foreign,
   expired or terminal bindings fail closed.
4. The HMS page exposes the documents as tabs; changing tabs never creates another
   session or invitation. Documenso receives the signer once and exposes its native
   multi-document item selector for the single signing ceremony.
5. Context GET never rotates a bearer alias. A refreshed recipient already in `signing`
   receives the fully acknowledged reading recovery state; the page asks them to continue and
   the CSRF-protected start action rotates the alias before rendering the local provider step.

## Server, provider and operations contract

## REST surface

Authenticated internal sending routes remain under the existing `FormalizationsController`
group and use HMS authorization. Their exact contract is:

Each new controller follows the current REST rule: its constructor receives the named
repositories/providers, instantiates its use case exactly once, and calls that instance
from the handler. New sending/Gateway actions are not added to or routed through
`FormalizationApplicationService`; the existing service remains untouched by these
controllers.

| Method and path | Authentication | Contract |
| --- | --- | --- |
| GET /formalizations/:formalizationId/signature-sending/review | HMS actor | Authoritative ready-state review, blocking issues and current request summary. |
| POST /formalizations/:formalizationId/signature-sending/confirm | Associated lawyer/admin | `expectedVersion` plus `confirmationKey`; returns the existing/new request status idempotently. |
| GET /formalizations/:formalizationId/signature-sending/status | HMS actor | Safe request/document progress with `canCancel`/`canRetry`; no provider IDs or tokens. |
| POST /formalizations/:formalizationId/signature-sending/cancel | Associated lawyer/admin | `expectedVersion`; revokes HMS access and schedules cancellation of the shared provider envelope. |

The existing `FormalizationService` Web port and adapter add these exact methods:

```ts
getSignatureSendingReview(formalizationId: string): Promise<RestResponse<FormalizationSignatureSendingReviewResponse>>
confirmSignatureSending(formalizationId: string, input: ConfirmFormalizationSignatureSendingCommand): Promise<RestResponse<FormalizationSignatureSendingStatusResponse>>
getSignatureSendingStatus(formalizationId: string): Promise<RestResponse<FormalizationSignatureSendingStatusResponse>>
cancelSignatureSending(formalizationId: string, input: CancelFormalizationSignatureSendingCommand): Promise<RestResponse<FormalizationSignatureSendingStatusResponse>>
```

All Gateway JSON routes use the prefix /formalizations/signing-gateway through the
`SigningGatewayController` decorator. They accept
credentials, use exact configured Web origins, set Vary: Origin and never use wildcard
CORS. Public endpoints have dedicated throttling in addition to domain limits.

| Method and path | Authentication | Contract |
| --- | --- | --- |
| POST /invitations/exchange | Exact Origin plus raw fragment token body | Atomic one-time exchange; sets flow/device cookies; returns safe step and in-memory CSRF token. |
| GET /context | Any valid Gateway cookie | Rotates/returns CSRF and safe discriminated step; clears invalid cookies. |
| GET /channels | Flow cookie | Returns opaque channel choice IDs and masked destinations. |
| POST /otp | Flow/device plus CSRF | Requests a challenge; returns challenge ID, safe expiry/cooldown and generic delivery status. |
| POST /otp/verify | Flow/device plus CSRF | Verifies code and rotates flow cookie to authenticated session cookie. |
| POST /collaborator/session | Flow/device, HMS auth plus CSRF | Establishes exact assigned collaborator session or fails closed. |
| GET /documents | Authenticated signing session | Returns all immutable package document metadata in authoritative order, acknowledged document IDs and current request version. |
| GET /documents/:requestDocumentId/content | Authenticated signing session | Streams that package PDF only after request membership validation, with no-store, nosniff and controlled byte-range headers. |
| POST /documents/:requestDocumentId/acknowledgement | Authenticated session plus CSRF | Persists an explicit acknowledgement for that document/snapshot and returns its safe timestamp. |
| POST /signing | Authenticated session plus CSRF | Requires every package document acknowledgement and returns only the package-scoped HMS proxy path/alias. |
| GET /result | Read-only result receipt | Returns safe terminal/pending status and protocol; no recipient contact, provider or file data. |
| DELETE /result | Read-only result receipt plus CSRF | Revokes receipt and clears Gateway cookies. |
| POST /webhooks/documenso | X-Documenso-Secret, no browser CORS | Verifies, persists/deduplicates and enqueues; returns 2xx promptly. |

Final controller ownership is one class and one test per action. The JSON actions are
`ExchangeSignatureInvitationController`, `GetSignatureGatewayContextController`,
`ListSignatureAuthenticationChannelsController`, `RequestSignatureOtpController`,
`VerifySignatureOtpController`, `EstablishCollaboratorSigningSessionController`,
`ListSignatureDocumentsController`, `GetSignatureDocumentContentController`,
`AcknowledgeSignatureDocumentController`, `StartSigningController`,
`GetSignatureResultController` and `CloseSignatureResultController`, all using the
shared `SigningGatewayController` decorator prefix. `SigningGatewayWebhookController`
owns only `POST /formalizations/signing-gateway/webhooks/documenso`. The current
multi-action `signing-gateway.controller.ts` is removed after parity is established.

`SigningGatewayProxyController` remains one provider-boundary controller but replaces
its broad `@All(':alias')` and `@All(':alias/{*path}')` declarations with method-specific
handlers only: `GET|HEAD /:alias`, `GET|HEAD /:alias/build/{*assetPath}`, `GET|HEAD
/:alias/assets/{*assetPath}`, the two exact recipient loader procedures, and the three
exact POST mutation procedures listed in the content-aware proxy table. There is no
generic method/path fallback; unmatched traffic is rejected by Nest before adapter
dispatch. The provision adapter still performs the second-layer procedure, query,
content-type and response checks.

`apps/server/rest-client/formalization/signing-gateway.rest` contains named operations
for exchange, context, channels, OTP request/verify, collaborator session, document
list, one placeholder document-content read, one placeholder acknowledgement, package
start, result read/close and webhook receipt. `signing-gateway-proxy.rest` contains the
bootstrap, one asset, one loader and each allowed mutation class. The matching
controller test named in the affected-path ledger is the parity validation target for
every operation/path/method; no `.rest` operation may exist without that test coverage.

`packages/core/src/formalization/interfaces/signing-gateway-service.ts` is the Web-facing
port. It imports only the Core-owned command/response structures declared above; dates
are ISO strings at this REST boundary. Server and Web adapters independently parse the
structurally equivalent Validation schemas, so neither Core service interface imports
`@hms/validation`:

```ts
export interface SigningGatewayService {
  exchangeInvitation(input: ExchangeSignatureInvitationCommand): Promise<RestResponse<FormalizationSignatureGatewayContextResponse>>
  getContext(): Promise<RestResponse<FormalizationSignatureGatewayContextResponse>>
  listChannels(): Promise<RestResponse<FormalizationSignatureAuthenticationChannels>>
  requestOtp(input: RequestSignatureOtpCommand): Promise<RestResponse<{ readonly challengeId: string; readonly expiresAt: string; readonly resendAvailableAt: string }>>
  verifyOtp(input: VerifySignatureOtpCommand): Promise<RestResponse<FormalizationSignatureGatewayContextResponse>>
  establishCollaboratorSession(): Promise<RestResponse<FormalizationSignatureGatewayContextResponse>>
  getDocuments(): Promise<RestResponse<FormalizationSignatureGatewayDocumentsResponse>>
  getDocumentContent(requestDocumentId: string): Promise<RestResponse<ArrayBuffer>>
  acknowledgeDocument(requestDocumentId: string, input: AcknowledgeSignatureDocumentCommand): Promise<RestResponse<FormalizationSignatureDocumentAcknowledgementResponse>>
  startSigning(input: StartFormalizationSigningCommand): Promise<RestResponse<{ readonly proxyPath: string; readonly expiresAt: string }>>
  getResult(): Promise<RestResponse<FormalizationSignatureGatewayResultResponse>>
  closeResult(): Promise<RestResponse<void>>
}
```

`apps/web/src/rest/services/signing-gateway-service.ts` exports
`SigningGatewayService(restClient: RestClient, csrfStore: SigningGatewayCsrfStore):
SigningGatewayServiceContract`. `AxiosRestClient` receives an additive request-options
contract for `credentials: 'include'` and per-request headers; the adapter does not create
a competing transport. It adds the in-memory `X-HMS-Signing-CSRF` value to mutations,
parses every JSON response with the named schema, maps PDF content to `ArrayBuffer`, and clears
the CSRF value when cookies rotate or access becomes invalid. The Server keeps one controller file and one
controller test file per REST row, plus the content proxy controller/contract suite;
the exact file ledger below is authoritative.

The provider UI proxy is mounted before the TanStack/SPA fallback at
/assinaturas/provedor/:alias/* and is routed to Server under the same public HMS Web
origin. The alias is random and has no provider/recipient semantics. Production ingress
must not expose the Documenso service hostname or port. Local development may bind the
provider only to loopback for diagnostics; integration tests use the HMS proxy path.
`apps/web/vite.config.ts` proxies `/assinaturas/provedor` to the configured local Nest
origin before TanStack handling. Shared deployment applies the identical longest-prefix
rule at the external ingress under G-05; because that platform configuration is not in
this repository, its change identifier and rollback command are execution evidence, not
an invented local path.
The proxy controller uses a distinct
`apps/server/src/formalization/decorators/signing-gateway-proxy-controller.decorator.ts`
with `Controller('assinaturas/provedor')` and `ApiTags('Signing Gateway Proxy')`.
`apps/server/rest-client/formalization/signing-gateway.rest` covers every JSON Gateway
operation; `apps/server/rest-client/formalization/signing-gateway-proxy.rest` covers the
proxy bootstrap, asset/read action and classified signing mutation with placeholder
aliases only.

## Cookies and CSRF

Production cookie names are __Host-hms-sign-flow, __Host-hms-sign-session and
__Host-hms-sign-device. Every cookie is Secure, HttpOnly,
SameSite=Lax, Path=/ and has no Domain. Development uses unprefixed hms-sign-* names
only when HTTPS is unavailable; tests assert production configuration cannot emit the
fallback names.

- Flow max-age is the remaining invitation lifetime, never more than seven days.
- Authenticated session and device binding expire at the earliest of 24 hours,
  invitation/request terminal time or explicit revocation.
- Proxy binding has a 30-minute idle timeout and never outlives the authenticated
  session.
- In-place result authority keeps the existing sign-session cookie and expires at that
  session's original expiry, never later than 24 hours; no second result bearer cookie or
  plaintext secret is created.
- Cookie contents are independent random 256-bit values. Values are hashed at rest and
  are not JWTs or encoded business identifiers.
- Rotation clears the predecessor with identical cookie attributes. Submission does not rotate
  the sign-session cookie; it atomically reduces the persisted session kind to `result`.
  Terminal and
  invalid-session responses clear every Gateway cookie.
- GET /context issues a fresh synchronizer CSRF value tied to the current Gateway
  session. The Web retains it only in memory; every state-changing request sends it in
  X-HMS-Signing-CSRF. Exact Origin and application/json checks are mandatory.

HMS collaborator Auth cookies remain separate. A public client Gateway failure must
never trigger the global Web REST client's sign-out behavior.

## Documenso API adapter

DocumensoSignatureProvider uses native fetch through a private base URL and the
instance API credential; no browser SDK or paid embed feature is introduced. The
adapter owns every provider DTO and maps them before Core. It must:

- assert the runtime provider version/health is compatible with v2.17.0;
- consume envelope API V2, never the deprecated document-creation contract;
- retrieve envelope/recipient state and completed artifacts by provider IDs;
- keep distributionMethod/emailSettings configured so Documenso sends no recipient
  message or reminder;
- treat provider signingUrl/token as SecretText and immediately encrypt or pass it only
  to the private proxy boundary;
- use bounded connect/body/total timeouts, response-size limits, retry only safe
  idempotent reads and redact response bodies from exceptions;
- carry HMS idempotency/correlation metadata where the API supports it;
- expose a fake provider for Core/REST/job tests and sanitized contract fixtures for
  pinned-provider tests.

`ProvisionFormalizationSignatureRequestUseCase` owns envelope creation and
distribution through this port. It is the only creation path, always suppresses
provider e-mail/reminders, uploads every immutable request PDF in one ordered envelope,
and persists item mappings plus encrypted recipient credentials before emitting any
invitation-ready event.

## Content-aware proxy contract

The v2.17.0 contract is frozen in
`apps/server/src/formalization/provision/documenso-signing-gateway-contract.ts` and
sanitized fixtures under
`apps/server/src/formalization/provision/tests/fixtures/documenso-v2-17-0-signing`.
No catch-all provider route is permitted.

| Method | Provider path/procedure | Class | Limits | HMS interpretation |
| --- | --- | --- | --- | --- |
| GET | `/sign/{providerCredential}` | HTML bootstrap | HTML <= 2 MiB | Rewrite credential/origins/assets/CSP; read-only. |
| GET | `/build/{fingerprintedAsset}` | JS/CSS asset | <= 5 MiB | Rewrite textual origin/credential occurrences. |
| GET | `/assets/{fingerprintedAsset}` | font/image asset | <= 10 MiB | Pass only the declared font/image MIME allow-list. |
| GET | `/api/trpc/recipient.getRecipientByToken` | JSON loader | <= 2 MiB | Inject credential server-side; strip token/contact fields. |
| GET | `/api/trpc/recipient.getEnvelopeForSigning` | JSON loader | <= 5 MiB | Restrict response to the shared request envelope, every package item and the recipient's fields. |
| POST | `/api/trpc/envelope.signEnvelopeField` | signing mutation | request <= 1 MiB; response <= 2 MiB | Permit snapshot field IDs only; success is progress, not submission. |
| POST | `/api/trpc/recipient.completeDocumentWithToken` | completion mutation | request <= 256 KiB; response <= 2 MiB | Successful classified response records submitted before returning. |
| POST | `/api/trpc/recipient.rejectDocumentWithToken` | rejection mutation | request <= 64 KiB; response <= 1 MiB | Revoke access and reconcile; never classify as signed. |

Query parameters are limited to tRPC `batch=1` and percent-encoded JSON input; the
proxy parses and reconstructs them and rejects duplicate or unknown keys. `HEAD` is
allowed only for the three GET bootstrap/asset rows. Every other method, path, tRPC
procedure, websocket, upload, multipart body, event stream, form action, redirect or
MIME type fails closed. If the pinned container uses a different path/procedure, the
contract suite fails and requires a Spec revision; a Builder may not broaden the list.

Source inspection of the pinned normal recipient route shows that the provider token
appears in route/loader data. A network-only reverse proxy is therefore insufficient.
The HMS proxy is an explicit compatibility adapter:

1. Resolve alias plus HMS authenticated session/device and revalidate recipient/request.
2. Translate the HMS alias to the raw provider credential only in server memory.
3. Allow only the pinned recipient-view assets, loaders, actions and API calls. Deny
   authoring, account, team, admin, template, arbitrary fetch and open-redirect paths.
4. For a classified signing mutation, reread collaborator eligibility when applicable,
   snapshot identity and request state immediately before forwarding.
5. Rewrite alias to raw token and HMS provider path/origin to private provider form in
   the HMS request. Do not forward HMS Auth/Gateway cookies.
6. Strip hop-by-hop, provider CSP/frame, server, powered-by and unsafe cache headers.
   Provider cookies are either dropped or renamed/path-scoped to the alias after a
   documented necessity review; no raw token may enter a cookie value.
7. Decompress and inspect every textual HTML, JSON, JavaScript, CSS, XML and form
   response. Replace raw token and private/public provider origins with the alias/HMS
   origin in bodies and Location/Link/Refresh headers. Recompute length/encoding.
8. Apply Cache-Control: no-store, Referrer-Policy: no-referrer,
   X-Content-Type-Options: nosniff, a restrictive Permissions-Policy and a nonce/hash
   CSP derived from the pinned UI. The surrounding page permits framing only from the
   same HMS origin if an iframe is used.
9. Binary responses pass only from allow-listed endpoints and media types with size
   limits. Signed/completion downloads are not exposed through the proxy; HMS
   reconciliation preserves them privately.
10. If content cannot be safely classified/rewritten, if the token remains after
    rewriting, or if the provider contract changed, return the derived provider
    unavailable state, revoke the binding and emit a high-severity metric.
11. A successful classified completion mutation records submission and revokes the
    binding before the browser can repeat it. Ambiguous timeout/failure also revokes
    signing access and triggers reconciliation instead of offering a duplicate submit.

The contract suite uses a unique canary provider token and asserts zero occurrences in
the browser-visible URL, responses, DOM, iframe data, network names/bodies, cookies,
local/session storage, IndexedDB, Cache Storage, service workers, console, Playwright
trace, screenshots/OCR where applicable and HMS structured logs.

## Webhook and reconciliation mapping

Webhook `envelopeItemId` is an optional scheduling hint because not every pinned
Documenso event supplies it. It is mapped only through
`FormalizationSignatureProviderDocumentResource`; an unknown item fails closed and
schedules API reconciliation. The API read is authoritative and envelope-scoped: one
provider response must return one normalized envelope state plus every expected recipient
and every envelope item visible to that recipient. Missing, foreign or duplicate recipients
or items make the snapshot incoherent and schedule retry without applying receipt,
recipient, document, request or Formalization changes. The adapter maps the pinned provider
response into one `FormalizationSignatureProviderObservation`; unknown provider values fail
closed and schedule reconciliation. Reconciliation never combines independently timed
recipient reads or selects an envelope status from one recipient observation. Recipient
status alone cannot submit the package recipient or
submit/confirm a request document. The package recipient becomes `submitted` only when
every `required` item assigned to that recipient is `completed`. A mapped document
becomes `submitted` only when every assigned recipient has a `completed` observation
for that item, and becomes `confirmed` only when the envelope is `completed` and that
item's signed PDF is durable. `rejected`, `cancelled` and `expired` item states are
terminal and monotonic: the adapter may emit them only when the authoritative item or
envelope state proves the same outcome; an envelope-terminal outcome is fanned out to
every non-completed item, while an already completed item remains completed for audit.
The transaction derives the matching request-document terminal state, revokes package
access and applies the request-level terminal policy. `draft`, `pending` or
`in_progress` envelope state can never confirm an item, recipient, document or request.

Webhook processing passes the persisted webhook receipt as the sole `receiptUpdates` entry
when it applies a safe one-recipient hint. Before decryption it atomically calls
`claimWebhookReceipt` with the generated primary key, a fresh unique claim token and bounded
30-second expiry. `ProcessSignatureProviderWebhookUseCase` obtains that internal concurrency
token from the existing `IdProvider`; it is not an authentication or security token and is
never accepted from the job payload. A newly claimed update carries `expectedClaimToken`; an `already_processed` replay omits it and the
transaction treats only that receipt row as unchanged. Missing/busy claims or malformed and
undecryptable payloads return `retry_required`; the latter release/fail the owned claim for a
bounded retry. They do not publish an event because no trusted request ID is available. The
Inngest job is configured with `retries: 5`: `processed`, `already_processed` and
`reconciliation_requested` complete normally, while `retry_required` throws a retriable
application error and must never be converted to `NonRetriableError`. After the fifth retry,
the receipt remains `failed` with its attempts and next-attempt metadata for audit; the
request-level scheduled reconciliation continues from persisted request/provider mappings and
does not depend on fabricating a request ID from the receipt.
`claimWebhookReceipt` atomically claims a due `pending`/`failed` receipt or a `processing`
receipt whose lease expired, sets `processing`, the unique token and expiry, and increments
attempts once; it returns `busy` for any live claim and returns the immutable row as
`already_processed` without a write when terminal processing already completed.
`failWebhookReceiptClaim` changes only a row matching the exact still-live claim token to
`failed`, clears claim/expiry and sets its bounded `nextAttemptAt`.
`completeWebhookReceiptClaim` changes only a row matching the exact still-live claim token
to `processed`, clears claim/expiry and sets `processedAt`; a missing, stale or expired token
returns `conflict`. It is used only for a strict `reconciliation_only` hint, so no recipient,
document, request or Formalization observation accompanies this receipt-only transaction.
The Server-owned `DocumensoWebhookNormalizer` at
`apps/server/src/formalization/provision/documenso-webhook-normalizer.ts` owns the pinned
Documenso event constants. The webhook controller validates the raw
`DocumensoWebhookInput` and authenticated event header, calls this normalizer, and passes only
its neutral result to `ReceiveSignatureProviderWebhookUseCase`. The normalizer canonicalizes
the provider event ID/header/body into the 32-byte `dedupeKey`, resolves the provider envelope,
recipient and item IDs through the Formalization provider-resource repositories, rereads the
current request/recipient/document/Formalization versions, maps a supported event to an
`observation` hint or any other valid event for a known request to
`reconciliation_only`, encrypts that neutral hint through `SensitivePayloadCipherProvider`
with purpose `webhook` and the dedupe hash as context, and returns exactly:

```ts
type DocumensoWebhookNormalizationResult = {
  readonly dedupeKey: string
  readonly hintKind: 'observation' | 'reconciliation_only'
  readonly encryptedHint: string
  readonly cipherKeyId: string
}

export class DocumensoWebhookNormalizer {
  normalize(input: {
    readonly eventName: string
    readonly webhook: DocumensoWebhookInput
    readonly receivedAt: Date
  }): Promise<DocumensoWebhookNormalizationResult>
}
```

It makes no provider network call. Missing/foreign/ambiguous resource mappings fail closed
to a generic accepted-but-unprocessable audit result at the controller boundary and never
invent an HMS request ID; the raw provider payload is not persisted or logged. The controller
still persists and schedules every successfully normalized receipt and returns within the
RF-16 ten-second budget. `FormalizationProvisionModule` provides/exports the normalizer and
`FormalizationModule` composes it into the existing webhook controller. Core validates the
discriminator, every closed status/assignment value,
positive optimistic versions, non-negative field counts and
`completedFieldCount <= requiredFieldCount` before any mutation. Core never switches on a
Documenso event-name string. A valid `reconciliation_only` hint publishes only its trusted
`requestId`, returns `reconciliation_requested`, and never invokes
`recordProviderObservationAndDerive`.
Scheduled/API reconciliation passes
`receiptUpdates: []`; the webhook processor owns its actual receipt before it publishes the
separate reconciliation request. Neither path invents a receipt for a provider recipient.
Replaying an already-processed
receipt may still apply a newer coherent provider snapshot; receipt idempotency and provider
state idempotency are evaluated independently inside the same transaction.

| Documenso v2.17.0 event | HMS action |
| --- | --- |
| DOCUMENT_OPENED | Record provider opening; keep the recipient in its valid authentication/reading/signing state and derive the package request projection to `in_progress` only if monotonic. |
| DOCUMENT_SIGNED | Map the optional item hint, record only the normalized recipient/item observation available, and schedule immediate API reconciliation. |
| DOCUMENT_RECIPIENT_COMPLETED | Record the scheduling hint only and reconcile every assigned item through API authority; mark the package recipient submitted and revoke access only if the authoritative read proves every required assigned item completed. |
| DOCUMENT_COMPLETED | Reconcile envelope authority, download every required completed artifact and confirm only after preservation. |
| DOCUMENT_REJECTED | Reconcile, then apply rejected and revoke access if API agrees. |
| DOCUMENT_CANCELLED | Reconcile, then apply cancelled and revoke access if API agrees. |
| RECIPIENT_EXPIRED | Reconcile the recipient and apply expired when API agrees. |

Payload event names are adapter constants, not Core enums. The webhook secret is
different from the Documenso API key and HMS cipher/pepper keys. Multiple active
webhook-secret versions may be accepted only during a time-boxed rotation and are
compared independently in constant time.

Inngest functions:

- process-formalization-signature-webhook leases one receipt and reconciles it;
- reconcile-formalization-signature-request handles immediate and retry schedules;
- sweep-formalization-signature-access expires ephemeral access and purges expired
  secret material;
- deliver-signature-otp belongs to Communication and reports delivery result.

Submitted/reconciliation-required requests retry quickly with bounded exponential
backoff, then on a five-minute schedule for 24 hours. Continued failure pages
operations and remains visible internally; it never fabricates confirmation. A periodic
safety sweep reconciles non-terminal provider requests even when webhooks were lost.

## Deployment and environment

docker-compose.yaml adds a private Documenso application and a separate PostgreSQL
database/volume. It must not reuse HMS/Supabase PostgreSQL or a SQLite file. The
application image is exactly:

ghcr.io/documenso/documenso@sha256:1377ba20181d4d029e768b7b7615e4e49c39450a85588a525e78dc586dd2569c

Required Documenso configuration includes NEXT_PUBLIC_WEBAPP_URL,
NEXT_PUBLIC_BASE_PATH where used, NEXTAUTH_SECRET, NEXT_PRIVATE_ENCRYPTION_KEY,
NEXT_PRIVATE_DATABASE_URL, NEXT_PRIVATE_DIRECT_DATABASE_URL,
NEXT_PRIVATE_SIGNING_TRANSPORT=local, NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH and
NEXT_PRIVATE_SIGNING_PASSPHRASE. The PKCS#12 file is a read-only secret mount; its
password and all keys remain outside Git. Documenso SMTP/recipient e-mail settings are
disabled or directed to an isolated non-delivering sink in non-production tests.

Server environment validation adds:

- DOCUMENSO_PRIVATE_BASE_URL, DOCUMENSO_API_V2_KEY, DOCUMENSO_WEBHOOK_SECRET and
  DOCUMENSO_EXPECTED_VERSION;
- HMS_SIGNING_OTP_PEPPER, HMS_SIGNING_IP_FINGERPRINT_KEY and HMS_SIGNING_CIPHER
  keyring/current key ID;
- HMS_SIGNING_PROXY_PUBLIC_PREFIX and explicit timeout/size
  controls;
- RESEND_API_KEY, HMS_SIGNING_EMAIL_FROM and the approved production sender identity
  for the missing EmailProvider adapter;
- documented defaults for invitation/session/result lifetime and rate limits, with
  production overrides constrained so they cannot weaken approved maxima.

Implement the repository-approved `EmailProvider` with `resend@6.25.0` and
register `ResendEmailProvider` in `CommunicationModule`; implementation freezes the
exact installed version in `apps/server/package.json` and `pnpm-lock.yaml`. Local and
controller fixtures use a purpose-built in-memory e-mail provider and assert the
decrypted message only inside the fixture boundary; they are not production-delivery
evidence. The existing WhatsApp provider remains unchanged and is not registered or
invoked by this signing flow. WhatsApp signing delivery is deferred to a future material
Spec revision that must define consent, templates, persistence migration, UI states and
validation before adding another channel value.

Production/Coolify exposes Web and the HMS API/webhook only. Documenso and its database
remain private services. Health checks cover database, Documenso, version pin,
certificate availability and HMS provider connectivity without returning secrets.

## Observability

Metrics carry low-cardinality request state and reason codes only:

- invitation exchanges accepted/rejected;
- OTP issue/delivery/verify/lock counts and latency by channel/outcome;
- authenticated sessions and provider bindings created/revoked;
- proxy request classification, rewrite failures and token-canary violations;
- webhook receipt/duplicate/processing latency;
- reconciliation age/retry/outcome and artifact preservation latency/failures;
- submitted-to-confirmed duration and requests stuck beyond thresholds.

Structured logs use correlation, request, recipient and receipt UUIDs where permitted,
never contacts or secrets. Alerts cover any proxy contract violation, webhook auth
failure surge, reconciliation older than 15 minutes, artifact preservation failure,
certificate expiry thresholds, provider version/digest drift and database/storage
health. Runbooks document provider downtime, ambiguous submission, webhook replay,
certificate rotation, encryption-key rotation and safe invitation/session revocation.

## Web application and experience contract

## Routes and client boundary

Create a public TanStack route family rooted at /assinaturas/acesso and a result view
under the same route boundary. The raw invitation URL is:

/assinaturas/acesso#convite={base64url-token}

On the first client effect, read and validate the fragment, call exchange, and execute
history.replaceState before rendering recipient-specific state. Never copy the fragment
into search params, router state, analytics, error reporting or a persisted query key.
If no fragment exists, GET /context may resume only through an existing Gateway cookie.

Create a dedicated SigningGatewayService using credentials: include and the Gateway
validation schemas. It does not use the authenticated RestClient's global 401
interceptor, bearer token, retry policy or query cache persistence. TanStack Query keys
contain only the constant gateway-context/channels/document/result domains; session,
invitation, OTP and provider aliases are never query-key material or devtool labels.
Sensitive queries set gcTime to zero where practical and clear on transition/revocation.

The collaborator branch redirects to /login with a server-issued safe return target.
Update login middleware/action so successful authentication returns only to a strict
relative allow-list beginning /assinaturas/acesso; reject encoded scheme-relative,
backslash, double-encoded and external inputs. The client branch never prompts for HMS
credentials.

## View-state machine

| Safe step | View and actions |
| --- | --- |
| exchanging | Neutral skeleton with no document/recipient metadata; no flash of an error before exchange resolves. |
| invitation | Node vnDP5. Explain identity confirmation and continue. |
| choose_channel | Node yGoz0, with revision-5 content overriding the historical image. It renders zero or one keyboard-operable masked e-mail confirmation; no WhatsApp option or multi-channel choice is present. |
| enter_otp | Node epRP0. One semantic six-digit input with segmented presentation, paste support, resend countdown and live delivery/error status. |
| collaborator_login | Safe login explanation and return action; after return, server establishes the exact collaborator session. |
| reading | Node UGhOX or collaborator Cl6te, amended by revision 6. Show every package document as keyboard-operable tabs, one browser-native PDF viewer for the active tab, a separate persisted `Li este documento` action per document and one disabled-until-all-read provider action. No custom zoom controller is rendered. |
| provider | Same-origin Gateway shell around the proxied recipient UI with safe cancel/return behavior; browser navigation never reveals the provider. |
| submitted | Node Ns3TQ. Confirmation pending, reference/result status and no signing/PDF action. |
| confirmed | Node o9uBLt. Protocol and preservation statement; close only. |
| unavailable/no_channel/otp_error/otp_locked | Nodes Ty3Vs, HkWES, wagTq and mBKko plus the derived states in the manifest. |

## Internal send widget and typing contract

The existing protected `/formalizacoes/$formalizationId` route and
`FormalizationSendingConfiguration` widget remain the owner. Revision 4 modifies that
tree and adds only the review/cancel dialogs and four feature hooks below; it does not
duplicate the Formalization page or create a new internal route.

```text
apps/web/src/ui/formalization/hooks/use-formalization-signature-sending-review-query.ts
apps/web/src/ui/formalization/hooks/use-confirm-formalization-signature-sending-action.ts
apps/web/src/ui/formalization/hooks/use-formalization-signature-sending-status-query.ts
apps/web/src/ui/formalization/hooks/use-cancel-formalization-signature-sending-action.ts
apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/index.tsx
apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/use-formalization-sending-configuration.ts
apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/tests/formalization-sending-configuration.test.tsx
apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/tests/use-formalization-sending-configuration.test.ts
apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/review-and-confirm-sending-dialog/index.tsx
apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/review-and-confirm-sending-dialog/use-review-and-confirm-sending-dialog.ts
apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/review-and-confirm-sending-dialog/tests/review-and-confirm-sending-dialog.test.tsx
apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/review-and-confirm-sending-dialog/tests/use-review-and-confirm-sending-dialog.test.ts
apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/cancel-all-signature-sending-dialog/index.tsx
apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/cancel-all-signature-sending-dialog/use-cancel-all-signature-sending-dialog.ts
apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/cancel-all-signature-sending-dialog/tests/cancel-all-signature-sending-dialog.test.tsx
apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/cancel-all-signature-sending-dialog/tests/use-cancel-all-signature-sending-dialog.test.ts
```

Pencil `qOfh6`/`YWfhi` govern the containing configuration and action card;
`nI1B0` governs review; `MC4E2` governs in-progress state; and `NSYug` governs
cancel-all. Existing `sxENj`, `Vx43H` and `HcT8k` remain regression references for
signatories and fields. `Cancelar configuração` continues to invoke the existing reset
action only before a request exists. `Configurar envio` opens review only when ready;
the dialog action is exactly `Confirmar e enviar`. After a request exists, the widget
polls safe status and exposes `Cancelar todos os envios` only when `canCancel`.

```ts
export type FormalizationSignatureSendingStatus = {
  requestId: string
  status: FormalizationSignatureRequestStatus
  version: number
  totalDocuments: number
  completedDocuments: number
  failedDocuments: number
  canCancel: boolean
  canRetry: boolean
}
export type SignatureSendingQueryResult<T> = {
  data?: T; error?: AppError; isLoading: boolean; isFetching: boolean
  refetch: () => Promise<void>
}
export type SignatureSendingActionResult<TData, TVariables> = {
  execute: (variables: TVariables) => Promise<TData>
  error?: AppError; isPending: boolean; reset: () => void
}
export const useFormalizationSignatureSendingReviewQuery:
  (formalizationId: string, enabled: boolean) => SignatureSendingQueryResult<FormalizationSignatureSendingReviewDto>
export const useConfirmFormalizationSignatureSendingAction:
  (formalizationId: string) => SignatureSendingActionResult<FormalizationSignatureSendingStatus, ConfirmFormalizationSignatureSendingInput>
export const useFormalizationSignatureSendingStatusQuery:
  (formalizationId: string, enabled: boolean) => SignatureSendingQueryResult<FormalizationSignatureSendingStatus>
export const useCancelFormalizationSignatureSendingAction:
  (formalizationId: string) => SignatureSendingActionResult<FormalizationSignatureSendingStatus, CancelFormalizationSignatureSendingInput>

export type ReviewAndConfirmSendingDialogProps = {
  open: boolean
  review?: FormalizationSignatureSendingReviewDto
  isLoading: boolean
  isPending: boolean
  error?: AppError
  onOpenChange: (open: boolean) => void
  onConfirm: (input: ConfirmFormalizationSignatureSendingInput) => void
}
export type ReviewAndConfirmSendingDialogController = {
  confirmationKey: string
  canConfirm: boolean
  handleConfirm: () => void
}
export function useReviewAndConfirmSendingDialog(
  props: ReviewAndConfirmSendingDialogProps,
): ReviewAndConfirmSendingDialogController

export type CancelAllSignatureSendingDialogProps = {
  open: boolean
  status: FormalizationSignatureSendingStatus
  isPending: boolean
  error?: AppError
  onOpenChange: (open: boolean) => void
  onConfirm: (input: CancelFormalizationSignatureSendingInput) => void
}
export type CancelAllSignatureSendingDialogController = {
  canConfirm: boolean
  handleConfirm: () => void
}
export function useCancelAllSignatureSendingDialog(
  props: CancelAllSignatureSendingDialogProps,
): CancelAllSignatureSendingDialogController
```

`confirmationKey` is generated once when the review dialog opens and retained through
HTTP retries; it is not regenerated by rerender. These feature React Query hooks have
no dedicated tests per the UI rules; the existing configuration pair and each new
dialog pair test them through the Formalization service mock.

## Complete external Gateway widget and typing contract

The route is a leaf and therefore has `apps/web/src/routes/assinaturas/acesso/index.tsx`
only; do not add `route.tsx` unless a real child-route layout with `Outlet` is later
approved. The route renders `SigningGatewayPage` and contains no orchestration. This
literal tree is normative; every required widget implementation, hook and test is an
independent file and no marker or wildcard implies additional files.

```text
apps/web/src/routes/assinaturas/acesso/index.tsx
apps/web/src/routes/login/index.tsx
apps/web/src/constants/routes.ts
apps/web/src/middlewares/require-auth-middleware.ts
apps/web/src/middlewares/redirect-authenticated-middleware.ts
apps/web/src/rest/axios/axios-rest-client.ts
apps/web/src/rest/axios/signing-gateway-rest-client.ts
apps/web/src/rest/services/signing-gateway-service.ts
apps/web/src/rest/services/tests/signing-gateway-service.test.ts
apps/web/src/provision/signing-gateway-csrf-store.ts
apps/web/src/ui/shared/contexts/rest-context/index.tsx
apps/web/src/ui/shared/contexts/rest-context/types/rest-context-value.ts
apps/web/src/ui/shared/contexts/rest-context/use-rest-context-provider.ts
apps/web/src/ui/shared/contexts/rest-context/tests/rest-context.test.tsx
apps/web/src/ui/formalization/hooks/use-signing-gateway-context-query.ts
apps/web/src/ui/formalization/hooks/use-exchange-signature-invitation-action.ts
apps/web/src/ui/formalization/hooks/use-signature-channels-query.ts
apps/web/src/ui/formalization/hooks/use-request-signature-otp-action.ts
apps/web/src/ui/formalization/hooks/use-verify-signature-otp-action.ts
apps/web/src/ui/formalization/hooks/use-establish-collaborator-signing-session-action.ts
apps/web/src/ui/formalization/hooks/use-signature-document-query.ts
apps/web/src/ui/formalization/hooks/use-acknowledge-signature-document-action.ts
apps/web/src/ui/formalization/hooks/use-start-signing-action.ts
apps/web/src/ui/formalization/hooks/use-signature-result-query.ts
apps/web/src/ui/formalization/hooks/use-close-signature-result-action.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/use-signing-gateway-page.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/tests/signing-gateway-page.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/tests/use-signing-gateway-page.test.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/invitation-access-step/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/invitation-access-step/use-invitation-access-step.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/invitation-access-step/tests/invitation-access-step.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/invitation-access-step/tests/use-invitation-access-step.test.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/channel-selection-step/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/channel-selection-step/use-channel-selection-step.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/channel-selection-step/tests/channel-selection-step.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/channel-selection-step/tests/use-channel-selection-step.test.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/use-otp-verification-step.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/tests/otp-verification-step.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/tests/use-otp-verification-step.test.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/otp-code-input/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/otp-code-input/use-otp-code-input.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/otp-code-input/tests/otp-code-input.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/otp-code-input/tests/use-otp-code-input.test.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/collaborator-login-step/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/collaborator-login-step/use-collaborator-login-step.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/collaborator-login-step/tests/collaborator-login-step.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/collaborator-login-step/tests/use-collaborator-login-step.test.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/use-document-reading-step.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/tests/document-reading-step.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/tests/use-document-reading-step.test.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/document-tab-list/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/document-tab-list/use-document-tab-list.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/document-tab-list/tests/document-tab-list.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/document-tab-list/tests/use-document-tab-list.test.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/signing-document-viewer/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/signing-document-viewer/use-signing-document-viewer.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/signing-document-viewer/tests/signing-document-viewer.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/signing-document-viewer/tests/use-signing-document-viewer.test.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/provider-signing-step/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/provider-signing-step/use-provider-signing-step.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/provider-signing-step/tests/provider-signing-step.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/provider-signing-step/tests/use-provider-signing-step.test.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-submitted-step/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-submitted-step/use-signature-submitted-step.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-submitted-step/tests/signature-submitted-step.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-submitted-step/tests/use-signature-submitted-step.test.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-confirmed-step/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-confirmed-step/use-signature-confirmed-step.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-confirmed-step/tests/signature-confirmed-step.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-confirmed-step/tests/use-signature-confirmed-step.test.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signing-unavailable-step/index.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signing-unavailable-step/use-signing-unavailable-step.ts
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signing-unavailable-step/tests/signing-unavailable-step.test.tsx
apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signing-unavailable-step/tests/use-signing-unavailable-step.test.ts
apps/web/tests/routes/formalization/signing-gateway.test.tsx
apps/web/src/routeTree.gen.ts
apps/web/vite.config.ts
```

The page hook owns the safe-step state machine and composes feature action/query hooks.
Nested hooks own local presentation/form behavior and never import React Query. Feature
hooks live in `apps/web/src/ui/formalization/hooks/` as
`use-signing-gateway-context-query.ts`, `use-exchange-signature-invitation-action.ts`,
`use-signature-channels-query.ts`, `use-request-signature-otp-action.ts`,
`use-verify-signature-otp-action.ts`,
`use-establish-collaborator-signing-session-action.ts`,
`use-signature-document-query.ts`, `use-acknowledge-signature-document-action.ts`,
`use-start-signing-action.ts`,
`use-signature-result-query.ts` and `use-close-signature-result-action.ts`. Per the UI
rules, these React Query hooks have no dedicated tests; widget tests exercise them at
the service mock boundary.

Their public signatures are exact and consume `RestResponse.body` only after
`isSuccessful` narrowing:

```ts
type SigningGatewayQueryResult<T> = { readonly data?: T; readonly error?: AppError; readonly isLoading: boolean; readonly isFetching: boolean; readonly refetch: () => Promise<void> }
type SigningGatewayActionResult<TData, TVariables> = { readonly execute: (variables: TVariables) => Promise<TData>; readonly error?: AppError; readonly isPending: boolean; readonly reset: () => void }
export const useSigningGatewayContextQuery: () => SigningGatewayQueryResult<SigningGatewayContext>
export const useExchangeSignatureInvitationAction: () => SigningGatewayActionResult<SigningGatewayContext, { readonly token: string }>
export const useSignatureChannelsQuery: (enabled: boolean) => SigningGatewayQueryResult<FormalizationSignatureAuthenticationChannels>
export const useRequestSignatureOtpAction: () => SigningGatewayActionResult<{ readonly challengeId: string; readonly expiresAt: string; readonly resendAvailableAt: string }, { readonly channelChoiceId: string }>
export const useVerifySignatureOtpAction: () => SigningGatewayActionResult<SigningGatewayContext, { readonly challengeId: string; readonly code: string }>
export const useEstablishCollaboratorSigningSessionAction: () => SigningGatewayActionResult<SigningGatewayContext, void>
export const useSignatureDocumentQuery: (requestDocumentId: string | undefined, enabled: boolean) => SigningGatewayQueryResult<ArrayBuffer>
export const useAcknowledgeSignatureDocumentAction: () => SigningGatewayActionResult<{ readonly requestDocumentId: string; readonly acknowledgedAt: string }, { readonly requestDocumentId: string; readonly expectedRequestVersion: number; readonly acknowledged: true }>
export const useStartSigningAction: () => SigningGatewayActionResult<{ readonly proxyPath: string; readonly expiresAt: string }, { readonly expectedRequestVersion: number }>
export const useSignatureResultQuery: (enabled: boolean) => SigningGatewayQueryResult<SigningGatewayResult>
export const useCloseSignatureResultAction: () => SigningGatewayActionResult<void, void>
export type SigningGatewayCsrfStore = { readonly get: () => string | null; readonly replace: (token: string) => void; readonly clear: () => void }
```

All props are declared beside their component as named `<WidgetName>Props`. Parsed
response structures alias the Core-owned REST records; Web adds only the presentation-
specific `exchanging` state and component prop records:

```ts
export type SigningGatewaySafeStep =
  | 'exchanging' | 'invitation' | 'choose_channel' | 'enter_otp'
  | 'collaborator_login' | 'reading' | 'provider'
  | 'submitted' | 'confirmed' | 'unavailable'
export type SigningGatewayDocument = FormalizationSignatureGatewayDocumentResponse
export type SigningGatewayResult = FormalizationSignatureGatewayResultResponse
export type SigningGatewayUnavailableReason = FormalizationSignatureUnavailableReason
export type SigningGatewayContext = FormalizationSignatureGatewayContextResponse

export type InvitationAccessStepProps = { isPending: boolean; onContinue: () => void }
export type ChannelSelectionStepProps = {
  channels: FormalizationSignatureAuthenticationChannels
  selectedChannelId?: string; isPending: boolean
  onSelect: (channelId: string) => void; onContinue: () => void
}
export type OtpVerificationStepProps = {
  code: string; expiresAt: string; resendAvailableAt: string
  error?: 'invalid' | 'expired' | 'locked'; isPending: boolean
  onCodeChange: (code: string) => void; onVerify: () => void; onResend: () => void
}
export type OtpCodeInputProps = {
  value: string; disabled?: boolean; invalid?: boolean
  describedBy?: string; onChange: (value: string) => void
}
export type CollaboratorLoginStepProps = {
  loginPath: string; isPending: boolean; onContinue: () => void
}
export type DocumentReadingStepProps = {
  documents: readonly SigningGatewayDocument[]
  activeDocumentId: string
  acknowledgedDocumentIds: readonly string[]
  content: ArrayBuffer | null
  isLoading: boolean; isAcknowledging: boolean; isStarting: boolean; error?: string
  onDocumentChange: (requestDocumentId: string) => void
  onAcknowledge: (requestDocumentId: string) => void
  onContinue: () => void
}
export type DocumentTabListProps = {
  documents: readonly SigningGatewayDocument[]
  activeDocumentId: string
  acknowledgedDocumentIds: readonly string[]
  onDocumentChange: (requestDocumentId: string) => void
}
export type SigningDocumentViewerProps = {
  documentId: string; title: string; content: ArrayBuffer | null
  isLoading: boolean; error?: string; onRetry: () => void
}
export type ProviderSigningStepProps = {
  proxyPath: string; title: string; onSubmitted: () => void; onUnavailable: () => void
}
export type SignatureSubmittedStepProps = {
  result: SigningGatewayResult; onRefresh: () => void; onClose: () => void
}
export type SignatureConfirmedStepProps = {
  result: SigningGatewayResult & { status: typeof FormalizationSignatureResultStatus.confirmed; protocol: string }
  onClose: () => void
}
export type SigningUnavailableStepProps = {
  reason: SigningGatewayUnavailableReason; result?: SigningGatewayResult
  retryAt?: string; onRetry?: () => void
}
export type SigningGatewayPageState =
  | { readonly step: 'exchanging' }
  | { readonly step: 'invitation'; readonly props: InvitationAccessStepProps }
  | { readonly step: 'choose_channel'; readonly props: ChannelSelectionStepProps }
  | { readonly step: 'enter_otp'; readonly props: OtpVerificationStepProps }
  | { readonly step: 'collaborator_login'; readonly props: CollaboratorLoginStepProps }
  | { readonly step: 'reading'; readonly props: DocumentReadingStepProps }
  | { readonly step: 'provider'; readonly props: ProviderSigningStepProps }
  | { readonly step: 'submitted'; readonly props: SignatureSubmittedStepProps }
  | { readonly step: 'confirmed'; readonly props: SignatureConfirmedStepProps }
  | { readonly step: 'unavailable'; readonly props: SigningUnavailableStepProps }
export function useSigningGatewayPage(): SigningGatewayPageState
```

`SigningGatewayPage` has no props. Its hook returns a discriminated union keyed by
`step`; each branch carries only the props for its widget. The provider branch receives
an HMS-relative `proxyPath`, never a Documenso URL/token. Add internal paths to
`ROUTES`; generate `routeTree.gen.ts`, never hand-edit it.

Do not render recipient name or document title until authenticated. After
authentication, show only the data necessary to identify the package signing act. Masked
channels are computed server-side; Web must not receive raw contacts just to mask them.

## PDF reader and signing transition

Use the browser-native PDF renderer already established by the Gateway and repository
tokens, but keep this reader isolated from provider data. It must:

- support every immutable request document in authoritative order;
- use fresh authorized content requests and revoke object URLs on change/unmount;
- expose a semantic tablist for document switching and leave page/zoom controls to the
  native PDF renderer; no duplicate HMS zoom controls are rendered;
- never prefetch content before authentication or after session/result transition;
- clear PDF bytes/object URLs/query state before provider/submitted/terminal views;
- display a recoverable private-storage error without a provider fallback;
- re-fetch Gateway context and expected request version immediately before each
  acknowledgement and before start-signing.

Each tab has an explicit `Li este documento` acknowledgement action with the complete
legal/product copy from the PRD. It is never inferred from scrolling and is recorded
server-side independently. The package action remains disabled until every document ID
is acknowledged. Entering the provider view is not submission.

## Accessibility, responsive and theme

- Use semantic headings/landmarks, explicit labels, described-by help/errors and a
  single polite live region for status. Do not announce countdown changes every second.
- OTP supports typing, paste, replacement, Backspace and arrow movement as one input;
  autocomplete=one-time-code and inputmode=numeric are hints, not weaker validation.
- Every transition moves focus to the view heading or first invalid field; modal-like
  provider/error surfaces restore focus safely.
- At 390×844, primary actions remain visible without horizontal document-page overflow.
  PDF internals may scroll within a labeled region.
- At 200% zoom, text/actions do not overlap and no essential action depends on hover.
- Honor prefers-reduced-motion. Use design tokens only; preserve light/dark contrast and
  visible focus from documentation/design.md.
- Prevent double submits with mutation state and server idempotency. Disabled controls
  retain explanatory text available to assistive technology.

## Security, privacy and compliance

## Threat model

| Threat | Required control and proof |
| --- | --- |
| Invitation theft through referrer/history/analytics | Fragment-only token, immediate POST exchange/history clearing, no third-party resources before clearing, Referrer-Policy no-referrer and canary trace test. |
| Offline guessing of a six-digit OTP | Purpose-separated HMAC with server pepper, no plaintext persistence, bounded validity/attempts/rates and constant-time compare. |
| Online enumeration and brute force | Generic responses, controller and domain throttles, transaction-safe invitation/IP windows, locks and low-cardinality abuse alerts. |
| Cookie/session theft or fixation | Independent cryptographic flow/session/device values, rotation at authentication boundaries, Secure/HttpOnly/SameSite, device hash, CSRF, exact Origin and terminal revocation. Result is a privilege-reduced session kind using the same existing session/device bearer pair, not an independent value or cookie; the in-place transition cannot restore signing privileges. |
| Cross-recipient or cross-document IDOR | Server derives recipient/request/snapshot from the session; URL document ID is checked against that immutable set on every access. |
| Stale collaborator authority | Exact Auth actor plus live active/profile/assignment checks at session, read, provider entry and signing mutation. |
| Provider token/origin disclosure | Encrypted server-only credential, random alias, content-aware bidirectional rewrite, CSP/header stripping, log redaction and release-blocking canary suite. |
| SSRF/open proxy through provider path | Private fixed base URL, route/method/content allow-list, no caller-supplied host, redirect validation, DNS/service-network policy and response limits. |
| Webhook forgery/replay | Separate high-entropy secret, length-safe constant-time verification, body limit/schema, encrypted receipt, dedupe and API reconciliation. |
| Provider/database/artifact inconsistency | Monotonic states, idempotent jobs, durable receipts, provider API authority, hashes and artifact-before-confirmation workflow. |
| Malicious PDF/provider content | Private storage, MIME/signature/size validation, no inline active content, sandboxed same-origin provider boundary as compatible, CSP and nosniff. |
| Secret exposure in diagnostics | SecretText types, redaction middleware, no body logging, sanitized fixtures, canary scans and restricted telemetry attributes. |
| Supply-chain/provider drift | Digest and version pin, contract tests on every provider upgrade, dependency review and fail-closed health/version check. |

The Gateway must undergo focused security review before production. At minimum review
CSRF/origin logic, cookie flags, cryptographic purpose separation/key rotation,
content-rewrite completeness, SSRF/path traversal, redirect/cookie rewriting, webhook
verification, public error disclosure, signed-artifact retention and operational access
to Documenso/PostgreSQL.

## Data minimization and retention

| Data | Storage | Retention rule |
| --- | --- | --- |
| Raw invitation/session/device/CSRF values and result authority | Invitation exists transiently in the provisioning process and encrypted Communication payload; session/device remain in browser HttpOnly cookies; CSRF remains in memory; hashes and the session's `authenticated`/`result` kind remain in HMS DB. No independent result value or cookie exists. | Raw invitation delivery payload is erased after bounded delivery retry; remaining material lasts only through exchange/session expiry or earlier revocation; the result kind cannot outlive the original session expiry; hashes purge on the approved ephemeral schedule. |
| OTP plaintext | Process memory only while encrypting the delivery event | Discard immediately; never logged, audited or written. |
| OTP MAC/challenge | HMS PostgreSQL | Through expiry plus the minimum fraud/audit period; then purge secret verifier while retaining redacted outcome audit. |
| Contact destination | Resolved live from Identity; encrypted delivery payload | Delivery retry lifetime only. Gateway stores masked display and destination fingerprint, not raw contact. |
| IP/user-agent | Purpose-keyed fingerprints and coarse risk metadata | Privacy-approved abuse/audit period; no fingerprint becomes authentication. |
| Provider recipient token | Encrypted provider-resource field/private process memory | Until recipient terminal plus operational retention; revoke/cryptographically erase per policy. Never browser-visible. |
| Invitation delivery payload | Encrypted invitation-send-attempt ledger | Only through the bounded Communication retry window; erase ciphertext after delivered or terminal retention expiry. Never log or expose the fragment token. |
| Webhook payload | Authenticated ciphertext in HMS PostgreSQL | Evidence/reconciliation retention approved with legal/security; parsed safe fields may remain longer. |
| Unsigned/signed PDF and evidence | Private HMS object storage plus metadata/hashes | Formalization/legal retention policy; not the ephemeral Gateway-session policy. |
| Audit/protocol | HMS PostgreSQL | Immutable legal/operational retention policy. |

Retention values that depend on HMS legal policy must be documented before production
and implemented as explicit jobs, not guessed in code. The implementation may retain
business evidence longer than ephemeral authentication material, but must not delete a
signed artifact because a session expired.

## Key and certificate handling

- Use separate secrets for invitation hashing, OTP MAC, IP fingerprinting, payload
  encryption, provider API, webhook authentication and Documenso internals.
- Ciphertext records include key ID and purpose-bound additional authenticated data so
  invitation/provider payloads cannot be swapped between rows.
- Support decrypt-old/encrypt-current rotation for provider/webhook payloads. Rotation
  jobs are resumable and audited without plaintext.
- Pepper rotation invalidates relevant open invitation/OTP/session material unless a
  dual-key window is explicitly implemented and tested.
- The Documenso PKCS#12 certificate is mounted read-only with least privilege. Monitor
  not-before/not-after and alert before expiry. Rotation is tested with no in-flight
  envelope corruption.
- `pnpm generate:documenso-certificate` invokes
  `scripts/generate-documenso-certificate.mjs`, creates the private key in an OS
  temporary directory, writes only `.secrets/documenso-signing.p12` and the optional
  public `.secrets/documenso-signing.crt`, verifies the bundle, applies owner-only
  permissions and removes the temporary private key on success or failure. A root
  `signing-private.key` is neither an output nor an accepted input.
- `.secrets` is rooted inside the project for local Docker Compose use but is excluded
  by both `.gitignore` and `.dockerignore`. Coworkers generate their own local bundle;
  the staging/production private key comes from managed secret storage and is never
  shared through chat, e-mail, Drive or source control.
- No secret or certificate is added to .env.example beyond placeholder names; local
  real values remain ignored.

## Licensing gate

Before code depending on self-hosted Documenso is released, the recorded AGPL review
must state the deployment/network-use position, whether HMS proxy modifications or
integration create source-distribution/offer obligations, which notices/source links
must be exposed and who owns ongoing compliance. The implementation may perform
reversible local technical work while review is pending and the Spec may be planned and
implemented. No public proxy exposure or shared staging/production release may proceed
without G-01 evidence.

## Evaluation and delivery plan

## Automated test layers

| Layer | Required coverage |
| --- | --- |
| Core Vitest | Ready-state review/authorization, request graph cardinality, confirmation idempotency, provisioning/cancellation state tables and leases, plus all Gateway OTP/race/collaborator/observation/artifact/protocol rules. |
| Validation lint/types plus consumer tests | Internal sending and public Gateway REST/event DTOs, strict secret formats, discriminated steps, unknown-key rejection and compile-time absence of provider token/link fields are checked in Server/Web consumers; Validation has no local tests. |
| Database integration | Real PostgreSQL request-graph constraints, confirmation-key/version races, provisioning/cancellation leases, SELECT FOR UPDATE/advisory-lock races, one-time exchange/verify, session revocation, webhook-receipt primary-key claim/owner/expiry and independent dedupe, full provider-observation batch commit/rollback and artifact confirmation. |
| Server REST fixtures | Internal send authorization/review/confirm/status/cancel plus Gateway guards, cookie attributes/rotation/clearing, Origin/CSRF, headers/ranges, generic errors, webhook constant-time edge cases and zero secret logging. |
| Communication/jobs | Encrypted invitation and OTP delivery, local e-mail fixture, Resend mapping, provisioning/cancel retries and idempotency, webhook mapping/reordering and reconciliation fault injection. |
| Provider contract | Real pinned v2.17.0 container, create/find/distribute/cancel API V2 DTO mapping, one multi-document envelope per request, exact envelope-item/field mapping, disabled provider e-mail, technical-alias recipient flows, proxy allow-list/rewrite and per-item completed artifacts. |
| Web widget/route | Internal review/progress/cancel dialogs and every external safe step/failure, document tabs, independent acknowledgements, focus/live regions, PDF cleanup, double-submit, login allow-list and result-only access. `page.route` tests are labeled isolated mocked coverage. |
| Full-system Playwright | Real HMS REST/Auth/PostgreSQL/storage/Inngest/Documenso and local e-mail fixture; staging adds real Resend delivery and mounted X.509. No page.route transport mocks. |

## Quality commands

Run focused tests while building, then the complete affected-package gate:

    pnpm --filter @hms/core test
    pnpm --filter @hms/core lint
    pnpm --filter @hms/core check-types
    pnpm --filter @hms/core check:architecture
    pnpm --filter @hms/validation lint
    pnpm --filter @hms/validation check-types
    pnpm --filter @hms/validation check:architecture
    pnpm --filter server test
    pnpm --filter server test:inngest
    pnpm --filter server check:code
    pnpm --filter server check:types
    pnpm --filter server check:architecture
    pnpm --filter web test
    pnpm --filter web check:code
    pnpm --filter web check:types
    pnpm --filter web check:architecture
    pnpm --filter web test:integration

Generate migrations only after models are complete:

    pnpm --filter server db:migration:generate -- --name signing_gateway

Inspect generated SQL/snapshot, apply it to a disposable/test database, test
forward migration from the current `ready_for_sending` baseline and verify the new
request-side tables contain no raw token/link column.

## Manual/e2e evidence matrix

| ID | Environment | Required evidence |
| --- | --- | --- |
| MV-01 | Local automated | Unit/integration output plus database race cases for send confirmation, provisioning, cancel-all, exchange, OTP issue/verify, submit and confirm. |
| MV-02 | Local full stack | A `ready_for_sending` configuration with at least two PDFs is reviewed and confirmed; one request, one shared envelope, every envelope-item mapping, one package recipient/invitation per signatory and one request-level attempt are created once; Communication delivers one HMS invitation; the client enters through its fragment, receives e-mail OTP only through the local Communication fixture, reads and acknowledges every PDF in HMS tabs, enters Documenso once, completes the multi-document ceremony, and sees submitted then confirmed while per-item PDFs and package protocols persist privately. |
| MV-03 | Local real Auth | Seed collaborator admin/user from Identity source, sign in through /login, verify safe return, exact assignment/role/status checks and collaborator read/sign flow without OTP. |
| MV-04 | Failure/recovery | Stop/restart PDF storage access, Documenso, webhook processing and artifact storage at controlled points; prove fail-closed UI, no duplicate signing and eventual reconciliation. |
| MV-05 | Token-boundary release gate | Canary token scan across URL/DOM/responses/network/storage/cookies/console/trace/screenshots/logs on normal, redirect, validation-error, rejection, cancellation and completion paths. Zero matches. |
| MV-06 | Accessibility/responsive | Keyboard-only, screen reader smoke, 390×844, 200% zoom, light/dark and reduced-motion evidence for happy path, OTP errors/lock and unavailable state. |
| MV-07 | Staging readiness | Real approved Resend recipient flow, provider e-mail silence, absence of the real e-mail in Documenso, mounted X.509 signature validation, webhook secret, private origin and exact digest/version evidence. |
| MV-08 | Security/operations | Security review sign-off, AGPL record, dependency/container scan, certificate/provider-drift alerts and redacted log/metric samples. |

For authenticated browser evidence follow the repository workflow exactly: verify
docker compose health, Auth health at localhost:8000/auth/v1/health and Inngest health
at localhost:5555/health; start persistent Server/Web sessions; wait for stable Nest
bootstrap; resolve seed credentials from identity-seeder and HMS_USER_SEED_PASSWORD;
verify both authenticated URL/content; use fresh accessible locators after navigation;
capture console, failed requests, responses, trace and screenshots; classify every
console error, 4xx/5xx, hydration warning or auth refresh failure; exercise narrow and
keyboard paths; stop recorded Web/Server sessions and leave shared Docker services
unchanged.

Local fixture delivery is not production delivery evidence. Staging MV-07 is mandatory
because Resend sender/domain approval, technical alias
behavior, provider privacy and X.509 cannot be inferred from fakes.

## Rollout and rollback

1. Add the SCRUM-140 request-side Core/schema/transaction contracts from the checked-in
   `ready_for_sending` baseline with all Gateway routes dark. G-01/G-02 may remain open
   during these reversible phases.
2. Merge additive schema/Core contracts with Gateway routes dark and no active public
   invitations.
3. Deploy private pinned Documenso/PostgreSQL locally and run health/version checks;
   satisfy G-02 before the staging signing-acceptance pass.
4. Satisfy G-01 before exposing the proxy in a shared environment, then run the full
   provider/proxy canary gates and G-02-backed staging flows.
5. Enable Gateway for an internal test Formalization cohort only after G-01/G-02;
   monitor submission,
   reconciliation and token-violation metrics.
6. Expand only after reconciliation age, artifact preservation and support runbooks are
   green.

Rollback disables invitation exchange/provider entry at the HMS feature flag/ingress
while leaving webhook receipt, reconciliation and artifact workers running. Never roll
back by deleting request/evidence rows, exposing Documenso directly or letting a
submitted request invite another signature. Provider/database downgrades are forbidden
without a reviewed forward migration and contract-suite evidence.

## Implementation tree

The file split and literal widget tree above are normative. `create-plan` is required
because persistence/security, provider operations, Core/Server and Web have dependent
phases. The Plan may split these paths among Builders, but it may not rename or imply
files without revising this Spec. The checked-in SCRUM-140 configuration files are
modified only where the affected-path ledger names them; request-side declarations are
new files and must not be collapsed into the existing configuration repository.

## Revision 13 current-worktree scope aggregation

By explicit user direction on 2026-09-07, this Spec is the delivery ledger for every
tracked or untracked repository file currently changed relative to `origin/develop`,
including changes outside the Formalization bounded context. The affected-path ledger
is generated from the same Git state consumed by `check:spec-implementation` and is
authoritative for structural inclusion. This aggregation records delivery scope; it
does not retroactively claim that unrelated behavior was designed, validated or
approved as Signing Gateway behavior. Existing feature contracts remain the semantic
authority for their own changes, and the revision-12 evidence waiver remains in force.

### Affected-path ledger

This deduplicated ledger incorporates every current repository change relative to the
resolved `origin/develop` baseline, including untracked non-ignored files. Ignored
certificate outputs are operational evidence, not repository paths, and therefore do
not appear here.

| Path | Change |
| --- | --- |
| `.dockerignore` | Modify |
| `.env.example` | Modify |
| `.github/workflows/check-pr-size.yml` | Modify |
| `.github/workflows/core-package-ci.yaml` | Modify |
| `.github/workflows/hermes-code-review.yaml` | Modify |
| `.github/workflows/server-app-ci.yaml` | Modify |
| `.github/workflows/web-app-ci.yaml` | Modify |
| `.gitignore` | Modify |
| `AGENTS.md` | Modify |
| `apps/server/.dependency-cruiser.mjs` | Modify |
| `apps/server/.env.example` | Modify |
| `apps/server/package.json` | Modify |
| `apps/server/README.md` | Modify |
| `apps/server/rest-client/case-management/cases.rest` | Remove |
| `apps/server/rest-client/consultation/consultations.rest` | Modify |
| `apps/server/rest-client/document-production/document-specifications.rest` | Modify |
| `apps/server/rest-client/formalization/formalizations.rest` | Create |
| `apps/server/rest-client/intake/intakes.rest` | Modify |
| `apps/server/rest-client/shared/dynamic-forms.rest` | Modify |
| `apps/server/src/app.module.ts` | Modify |
| `apps/server/src/case-management/case-management.module.ts` | Modify |
| `apps/server/src/case-management/constants/case-management-repositories.ts` | Modify |
| `apps/server/src/case-management/database/case-management-database.module.ts` | Modify |
| `apps/server/src/case-management/database/case-management-seeder.ts` | Modify |
| `apps/server/src/case-management/database/drizzle/mappers/drizzle-case-checklist-item-mapper.ts` | Remove |
| `apps/server/src/case-management/database/drizzle/mappers/drizzle-legal-case-mapper.ts` | Modify |
| `apps/server/src/case-management/database/drizzle/mappers/index.ts` | Modify |
| `apps/server/src/case-management/database/drizzle/models/case-checklist-gate-decision-model.ts` | Remove |
| `apps/server/src/case-management/database/drizzle/models/case-checklist-item-model.ts` | Remove |
| `apps/server/src/case-management/database/drizzle/models/case-checklist-item-status-model.ts` | Remove |
| `apps/server/src/case-management/database/drizzle/models/index.ts` | Modify |
| `apps/server/src/case-management/database/drizzle/models/legal-case-model.ts` | Modify |
| `apps/server/src/case-management/database/drizzle/models/legal-case-status-model.ts` | Modify |
| `apps/server/src/case-management/database/drizzle/repositories/drizzle-case-checklist-items-repository.ts` | Remove |
| `apps/server/src/case-management/database/drizzle/repositories/drizzle-legal-cases-repository.ts` | Modify |
| `apps/server/src/case-management/database/drizzle/repositories/index.ts` | Modify |
| `apps/server/src/case-management/database/drizzle/types/entities/drizzle-case-checklist-item.ts` | Remove |
| `apps/server/src/case-management/database/drizzle/types/entities/index.ts` | Modify |
| `apps/server/src/case-management/decorators/cases-controller.decorator.ts` | Remove |
| `apps/server/src/case-management/decorators/index.ts` | Remove |
| `apps/server/src/case-management/fixtures/case-management-module-fixture.ts` | Remove |
| `apps/server/src/case-management/rest/controllers/add-case-checklist-complementary-item.controller.ts` | Remove |
| `apps/server/src/case-management/rest/controllers/index.ts` | Remove |
| `apps/server/src/case-management/rest/controllers/list-case-checklist.controller.ts` | Remove |
| `apps/server/src/case-management/rest/controllers/list-my-legal-cases.controller.ts` | Remove |
| `apps/server/src/case-management/rest/controllers/review-case-checklist-gate.controller.ts` | Remove |
| `apps/server/src/case-management/rest/controllers/tests/add-case-checklist-complementary-item.controller.test.ts` | Remove |
| `apps/server/src/case-management/rest/controllers/tests/list-case-checklist.controller.test.ts` | Remove |
| `apps/server/src/case-management/rest/controllers/tests/list-my-legal-cases.controller.test.ts` | Remove |
| `apps/server/src/case-management/rest/controllers/tests/review-case-checklist-gate.controller.test.ts` | Remove |
| `apps/server/src/case-management/rest/dtos/case-checklist-item-response.dto.ts` | Remove |
| `apps/server/src/case-management/rest/dtos/index.ts` | Remove |
| `apps/server/src/case-management/rest/dtos/legal-case-response.dto.ts` | Remove |
| `apps/server/src/communication/constants/communication-providers.ts` | Create |
| `apps/server/src/communication/database/communication-seeder.ts` | Modify |
| `apps/server/src/communication/database/drizzle/models/communication-model.ts` | Modify |
| `apps/server/src/communication/database/drizzle/models/private-message-model.ts` | Modify |
| `apps/server/src/communication/messaging/communication-messaging.module.ts` | Modify |
| `apps/server/src/communication/messaging/inngest/jobs/index.ts` | Modify |
| `apps/server/src/communication/messaging/inngest/jobs/process-whatsapp-event-job.ts` | Modify |
| `apps/server/src/communication/messaging/inngest/jobs/send-formalization-signature-invitation-job.ts` | Create |
| `apps/server/src/communication/messaging/inngest/jobs/send-formalization-signature-otp-job.ts` | Create |
| `apps/server/src/communication/provision/formalization-signature-email-delivery-provider.ts` | Create |
| `apps/server/src/communication/provision/index.ts` | Create |
| `apps/server/src/communication/provision/resend-email-provider.ts` | Create |
| `apps/server/src/communication/provision/tests/formalization-signature-email-delivery-provider.test.ts` | Create |
| `apps/server/src/communication/provision/tests/resend-email-provider.test.ts` | Create |
| `apps/server/src/communication/rest/controllers/list-client-communications.controller.ts` | Modify |
| `apps/server/src/consultation/database/consultation-seeder.ts` | Modify |
| `apps/server/src/consultation/fixtures/consultation-module-fixture.ts` | Modify |
| `apps/server/src/consultation/rest/dtos/list-consultation-documents-response.dto.ts` | Modify |
| `apps/server/src/consultation/rest/dtos/select-current-consultation-document-version-response.dto.ts` | Modify |
| `apps/server/src/document-engine/constants/document-engine-providers.ts` | Remove |
| `apps/server/src/document-engine/database/documents-database.module.ts` | Modify |
| `apps/server/src/document-engine/database/documents-seeder.ts` | Modify |
| `apps/server/src/document-engine/database/documents.module.ts` | Modify |
| `apps/server/src/document-engine/database/drizzle/models/document-batch-file-model.ts` | Modify |
| `apps/server/src/document-engine/database/drizzle/models/document-batch-model.ts` | Modify |
| `apps/server/src/document-engine/database/drizzle/models/document-validation-log-model.ts` | Modify |
| `apps/server/src/document-engine/database/drizzle/repositories/document-batches-repository.ts` | Modify |
| `apps/server/src/document-engine/database/drizzle/repositories/drizzle-document-validations-repository.ts` | Modify |
| `apps/server/src/document-engine/database/real-documents-seeder.ts` | Modify |
| `apps/server/src/document-engine/fixtures/document-engine-module-fixture.ts` | Modify |
| `apps/server/src/document-engine/messaging/document-engine-messaging.module.ts` | Modify |
| `apps/server/src/document-engine/messaging/inngest/jobs/process-whatsapp-batch-job.ts` | Modify |
| `apps/server/src/document-engine/messaging/inngest/jobs/tests/process-whatsapp-batch-job.test.ts` | Create |
| `apps/server/src/document-engine/provision/case-checklist-update-provider.ts` | Remove |
| `apps/server/src/document-engine/provision/document-engine-provision.module.ts` | Remove |
| `apps/server/src/document-engine/rest/controllers/list-document-validations.controller.ts` | Modify |
| `apps/server/src/document-engine/rest/controllers/list-triage-document-batches.controller.ts` | Remove |
| `apps/server/src/document-engine/rest/controllers/record-document-validation-decision.controller.ts` | Modify |
| `apps/server/src/document-engine/rest/controllers/tests/list-document-validation-logs.controller.test.ts` | Modify |
| `apps/server/src/document-engine/rest/controllers/tests/list-triage-document-batches.controller.test.ts` | Remove |
| `apps/server/src/document-engine/rest/controllers/tests/record-document-validation-decision.controller.test.ts` | Modify |
| `apps/server/src/document-engine/rest/controllers/tests/request-document-resend.controller.test.ts` | Modify |
| `apps/server/src/document-production/ai/mastra/tools/save-generated-document-version-tool.test.ts` | Create |
| `apps/server/src/document-production/database/document-production-database.module.ts` | Modify |
| `apps/server/src/document-production/database/document-production-seeder.ts` | Modify |
| `apps/server/src/document-production/database/drizzle/mappers/drizzle-document-mapper.ts` | Modify |
| `apps/server/src/document-production/database/drizzle/models/document-model.ts` | Modify |
| `apps/server/src/document-production/database/drizzle/models/document-security-model.ts` | Remove |
| `apps/server/src/document-production/database/drizzle/models/index.ts` | Modify |
| `apps/server/src/document-production/database/drizzle/repositories/drizzle-documents-repository.ts` | Modify |
| `apps/server/src/document-production/database/drizzle/repositories/drizzle-package-documents-repository.ts` | Modify |
| `apps/server/src/document-production/database/seed-assets/contrato-de-formalizacao.docx` | Create |
| `apps/server/src/document-production/database/seed-assets/termo-de-honorarios.docx` | Create |
| `apps/server/src/document-production/document-production.module.ts` | Modify |
| `apps/server/src/document-production/rest/controllers/index.ts` | Modify |
| `apps/server/src/document-production/rest/controllers/tests/delete-document-specification.controller.test.ts` | Modify |
| `apps/server/src/document-production/rest/controllers/tests/get-document-specification.controller.test.ts` | Modify |
| `apps/server/src/document-production/rest/controllers/tests/update-document-specification-configuration.controller.test.ts` | Modify |
| `apps/server/src/document-production/rest/controllers/tests/update-document-specification-template.controller.test.ts` | Modify |
| `apps/server/src/document-production/rest/controllers/update-document-access-classification.controller.ts` | Remove |
| `apps/server/src/document-production/rest/dtos/index.ts` | Modify |
| `apps/server/src/document-production/rest/dtos/update-document-access-classification-request.dto.ts` | Remove |
| `apps/server/src/formalization/constants/formalization-providers.ts` | Create |
| `apps/server/src/formalization/constants/formalization-repositories.ts` | Create |
| `apps/server/src/formalization/constants/index.ts` | Create |
| `apps/server/src/formalization/database/drizzle/index.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-artifact-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-audit-entry-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-cancellation-attempt-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-document-acknowledgement-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-gateway-session-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-invitation-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-invitation-send-attempt-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-otp-challenge-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-otp-guard-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-otp-rate-reservation-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-otp-send-attempt-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-protocol-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-provider-document-resource-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-provider-recipient-resource-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-provider-resource-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-provisioning-attempt-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-proxy-binding-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-recipient-document-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-recipient-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-request-document-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-request-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-snapshot-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/drizzle-formalization-signature-webhook-receipt-mapper.ts` | Create |
| `apps/server/src/formalization/database/drizzle/mappers/index.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signatory-document-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signatory-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signatory-role-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-access-status-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-artifact-kind-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-artifact-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-audit-entry-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-cancellation-attempt-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-cancellation-attempt-status-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-delivery-status-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-document-acknowledgement-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-field-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-field-type-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-gateway-session-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-invitation-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-invitation-send-attempt-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-invitation-status-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-otp-challenge-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-otp-challenge-status-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-otp-guard-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-otp-rate-reservation-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-otp-send-attempt-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-preview-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-preview-state-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-protocol-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-provider-document-resource-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-provider-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-provider-recipient-resource-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-provider-resource-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-provisioning-attempt-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-provisioning-attempt-status-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-proxy-binding-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-recipient-document-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-recipient-kind-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-recipient-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-recipient-status-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-request-document-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-request-document-status-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-request-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-request-status-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-session-kind-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-snapshot-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-webhook-receipt-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/formalization-signature-webhook-status-model.ts` | Create |
| `apps/server/src/formalization/database/drizzle/models/index.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-artifacts-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-audit-writer.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-cancellation-attempts-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-configuration-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-document-acknowledgements-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-gateway-sessions-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-invitation-send-attempts-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-invitations-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-otp-challenges-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-otp-guards-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-otp-rate-reservations-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-otp-send-attempts-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-protocols-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-provider-document-resources-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-provider-recipient-resources-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-provider-resources-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-provisioning-attempts-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-proxy-bindings-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-recipient-documents-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-recipients-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-request-documents-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-requests-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-snapshots-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalization-signature-webhook-receipts-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/drizzle-formalizations-repository.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/index.ts` | Create |
| `apps/server/src/formalization/database/drizzle/repositories/signature-repository-utils.ts` | Create |
| `apps/server/src/formalization/database/drizzle/signature-binary.ts` | Create |
| `apps/server/src/formalization/database/drizzle/signature-bytea.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-artifact.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-audit-entry.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-cancellation-attempt.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-document-acknowledgement.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-gateway-session.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-invitation-send-attempt.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-invitation.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-otp-challenge.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-otp-guard.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-otp-rate-reservation.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-otp-send-attempt.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-protocol.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-provider-document-resource.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-provider-recipient-resource.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-provider-resource.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-provisioning-attempt.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-proxy-binding.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-recipient-document.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-recipient.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-request-document.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-request.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-snapshot.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature-webhook-receipt.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization-signature.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/drizzle-formalization.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/entities/index.ts` | Create |
| `apps/server/src/formalization/database/drizzle/types/index.ts` | Create |
| `apps/server/src/formalization/database/formalization-close-transaction.ts` | Create |
| `apps/server/src/formalization/database/formalization-database.module.ts` | Create |
| `apps/server/src/formalization/database/formalization-document-confirmation-transaction.ts` | Create |
| `apps/server/src/formalization/database/formalization-seeder.ts` | Create |
| `apps/server/src/formalization/database/formalization-signature-gateway-transaction.ts` | Create |
| `apps/server/src/formalization/database/formalization-start-transaction.ts` | Create |
| `apps/server/src/formalization/database/index.ts` | Create |
| `apps/server/src/formalization/decorators/formalizations-controller.decorator.ts` | Create |
| `apps/server/src/formalization/decorators/index.ts` | Create |
| `apps/server/src/formalization/decorators/signing-gateway-controller.decorator.ts` | Create |
| `apps/server/src/formalization/fixtures/formalization-module-fixture.ts` | Create |
| `apps/server/src/formalization/fixtures/index.ts` | Create |
| `apps/server/src/formalization/formalization.module.ts` | Create |
| `apps/server/src/formalization/index.ts` | Create |
| `apps/server/src/formalization/messaging/formalization-messaging.module.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/generate-formalization-signature-preview-job.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/generate-formalization-signature-previews-in-batch-job.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/index.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/mark-formalization-signature-invitation-delivery-job.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/mark-formalization-signature-otp-delivery-job.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/process-formalization-signature-cancellation-job.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/provision-formalization-signature-request-document-job.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/reconcile-formalization-signature-deliveries-job.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/reconcile-formalization-signature-previews-job.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/reconcile-formalization-signature-request-job.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/reconcile-formalization-signature-requests-job.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/tests/generate-formalization-signature-preview-job.test.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/tests/generate-formalization-signature-previews-in-batch-job.test.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/tests/provision-formalization-signature-request-document-job.test.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/tests/reconcile-formalization-signature-previews-job.test.ts` | Create |
| `apps/server/src/formalization/messaging/inngest/jobs/tests/reconcile-formalization-signature-requests-job.test.ts` | Create |
| `apps/server/src/formalization/provision/documenso-signature-provider.ts` | Create |
| `apps/server/src/formalization/provision/documenso-webhook-normalizer.ts` | Create |
| `apps/server/src/formalization/provision/formalization-intake-closure-service.ts` | Create |
| `apps/server/src/formalization/provision/formalization-intake-lifecycle-service.ts` | Create |
| `apps/server/src/formalization/provision/formalization-provision.module.ts` | Create |
| `apps/server/src/formalization/provision/formalization-signature-crypto.providers.ts` | Create |
| `apps/server/src/formalization/provision/formalization-signature-document-content-reader.ts` | Create |
| `apps/server/src/formalization/provision/formalization-signature-document-metadata-reader.ts` | Create |
| `apps/server/src/formalization/provision/formalization-signature-secret-hasher.ts` | Create |
| `apps/server/src/formalization/provision/formalization-signature-source-reader.ts` | Create |
| `apps/server/src/formalization/provision/formalization-source-reader.ts` | Create |
| `apps/server/src/formalization/provision/gotenberg-document-pdf-converter-provider.ts` | Create |
| `apps/server/src/formalization/provision/index.ts` | Create |
| `apps/server/src/formalization/provision/pdf-js-formalization-document-pdf-inspector-provider.ts` | Create |
| `apps/server/src/formalization/provision/tests/documenso-signature-provider.test.ts` | Create |
| `apps/server/src/formalization/provision/tests/formalization-signature-document-metadata-reader.test.ts` | Create |
| `apps/server/src/formalization/provision/tests/formalization-signature-secret-hasher.test.ts` | Create |
| `apps/server/src/formalization/provision/tests/formalization-signature-source-reader.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/acknowledge-signing-document.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/add-formalization-signatory.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/cancel-formalization-document-generation.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/cancel-formalization-signature-sending.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/close-formalization-contract-form.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/close-formalization-without-contract.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/close-signing-result.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/confirm-formalization-documents.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/confirm-formalization-signature-sending.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/establish-collaborator-signing-session.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/exchange-signing-invitation.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/generate-formalization-document.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/get-formalization-document-selection.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/get-formalization-document-version.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/get-formalization-signature-configuration.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/get-formalization-signature-preview-content.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/get-formalization-signature-sending-review.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/get-formalization-signature-sending-status.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/get-formalization.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/get-signing-document-content.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/get-signing-document.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/get-signing-gateway-context.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/get-signing-result.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/index.ts` | Create |
| `apps/server/src/formalization/rest/controllers/initialize-formalization-signature-configuration.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/list-formalization-documents.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/list-formalization-signature-candidates.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/list-signing-authentication-channels.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/list-signing-documents.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/remove-formalization-signatory.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/reopen-formalization-contract-form.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/reopen-formalization-document-package.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/replace-formalization-contract-form.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/replace-formalization-document-selection.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/replace-formalization-signatory-documents.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/replace-formalization-signature-fields.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/request-formalization-signature-preview-generation.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/request-signing-otp.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/reset-formalization-signature-configuration.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/review-formalization-document-version.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/save-formalization-contract-form-draft.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/save-manual-formalization-document-version.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/select-current-formalization-document-version.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/select-formalization-signatory-channel.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/signing-gateway-proxy.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/signing-gateway-webhook.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/signing-gateway.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/start-formalization.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/start-signing.controller.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/acknowledge-signing-document.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/add-formalization-signatory.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/cancel-formalization-document-generation.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/cancel-formalization-signature-sending.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/close-formalization-contract-form.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/close-formalization-without-contract.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/close-signing-result.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/confirm-formalization-documents.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/confirm-formalization-signature-sending.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/establish-collaborator-signing-session.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/exchange-signing-invitation.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/formalization-controller.regressions.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/generate-formalization-document.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/get-formalization-document-selection.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/get-formalization-document-version.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/get-formalization-signature-configuration.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/get-formalization-signature-preview-content.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/get-formalization-signature-sending-review.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/get-formalization-signature-sending-status.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/get-formalization.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/get-signing-document-content.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/get-signing-document.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/get-signing-gateway-context.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/get-signing-result.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/initialize-formalization-signature-configuration.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/list-formalization-documents.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/list-formalization-signature-candidates.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/list-signing-authentication-channels.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/list-signing-documents.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/remove-formalization-signatory.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/reopen-formalization-contract-form.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/reopen-formalization-document-package.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/replace-formalization-contract-form.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/replace-formalization-document-selection.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/replace-formalization-signatory-documents.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/replace-formalization-signature-fields.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/request-formalization-signature-preview-generation.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/request-signing-otp.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/reset-formalization-signature-configuration.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/review-formalization-document-version.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/save-formalization-contract-form-draft.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/save-manual-formalization-document-version.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/select-current-formalization-document-version.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/select-formalization-signatory-channel.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/signing-gateway-proxy.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/signing-gateway-webhook.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/start-formalization.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/start-signing.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/tests/verify-signing-otp.controller.test.ts` | Create |
| `apps/server/src/formalization/rest/controllers/verify-signing-otp.controller.ts` | Create |
| `apps/server/src/formalization/rest/dtos/formalization-document-generation-response.dto.ts` | Create |
| `apps/server/src/formalization/rest/dtos/formalization-document-list-response.dto.ts` | Create |
| `apps/server/src/formalization/rest/dtos/formalization-document-selection-response.dto.ts` | Create |
| `apps/server/src/formalization/rest/dtos/formalization-document-version-response.dto.ts` | Create |
| `apps/server/src/formalization/rest/dtos/formalization-response.dto.ts` | Create |
| `apps/server/src/formalization/rest/dtos/index.ts` | Create |
| `apps/server/src/formalization/rest/guards/optional-signing-gateway-collaborator.guard.ts` | Create |
| `apps/server/src/formalization/rest/index.ts` | Create |
| `apps/server/src/identity/constants/identity-repositories.ts` | Modify |
| `apps/server/src/identity/database/drizzle/repositories/drizzle-clients-repository.ts` | Modify |
| `apps/server/src/identity/database/identity-database.module.ts` | Modify |
| `apps/server/src/identity/database/identity-seeder.ts` | Modify |
| `apps/server/src/identity/fixtures/identity-module-fixture.ts` | Modify |
| `apps/server/src/identity/identity.module.ts` | Modify |
| `apps/server/src/identity/providers/tests/is-valid-supabase-server-key.test.ts` | Remove |
| `apps/server/src/identity/providers/tests/supabase-auth-providers.test.ts` | Remove |
| `apps/server/src/identity/rest/controllers/list-clients.controller.ts` | Modify |
| `apps/server/src/identity/rest/repositories/clients-with-intakes-repository.ts` | Create |
| `apps/server/src/intake/database/drizzle/repositories/drizzle-intakes-repository.ts` | Modify |
| `apps/server/src/intake/database/intake-seeder.ts` | Modify |
| `apps/server/src/intake/fixtures/intake-module-fixture.ts` | Modify |
| `apps/server/src/intake/intake.module.ts` | Modify |
| `apps/server/src/intake/messaging/inngest/jobs/complete-intake-after-consultation-job.ts` | Modify |
| `apps/server/src/intake/messaging/inngest/jobs/complete-intake-consultation-scheduling-job.ts` | Modify |
| `apps/server/src/intake/messaging/inngest/jobs/fail-intake-consultation-scheduling-job.ts` | Modify |
| `apps/server/src/intake/messaging/inngest/jobs/sync-intake-legal-context-job.ts` | Modify |
| `apps/server/src/intake/messaging/inngest/jobs/tests/complete-intake-after-consultation-job.test.ts` | Create |
| `apps/server/src/intake/messaging/inngest/jobs/tests/complete-intake-consultation-scheduling-job.test.ts` | Create |
| `apps/server/src/intake/messaging/inngest/jobs/tests/fail-intake-consultation-scheduling-job.test.ts` | Create |
| `apps/server/src/intake/messaging/inngest/jobs/tests/sync-intake-legal-context-job.test.ts` | Create |
| `apps/server/src/intake/rest/controllers/tests/list-client-intakes.controller.test.ts` | Modify |
| `apps/server/src/main.ts` | Modify |
| `apps/server/src/shared/communication/whatsapp.provider.spec.ts` | Modify |
| `apps/server/src/shared/communication/whatsapp.provider.ts` | Modify |
| `apps/server/src/shared/database/drizzle/database.module.ts` | Modify |
| `apps/server/src/shared/database/drizzle/drizzle-client.ts` | Modify |
| `apps/server/src/shared/database/drizzle/drizzle-repository.ts` | Modify |
| `apps/server/src/shared/database/drizzle/mappers/stored-file-mapper.ts` | Create |
| `apps/server/src/shared/database/drizzle/migrations/0038_eager_kate_bishop.sql` | Remove |
| `apps/server/src/shared/database/drizzle/migrations/0038_sharp_captain_flint.sql` | Create |
| `apps/server/src/shared/database/drizzle/migrations/0039_pink_spacker_dave.sql` | Create |
| `apps/server/src/shared/database/drizzle/migrations/0040_case_checklist_gate.sql` | Remove |
| `apps/server/src/shared/database/drizzle/migrations/0040_formalization_signature_configuration.sql` | Create |
| `apps/server/src/shared/database/drizzle/migrations/0041_case_checklist_completion.sql` | Remove |
| `apps/server/src/shared/database/drizzle/migrations/0041_worried_texas_twister.sql` | Create |
| `apps/server/src/shared/database/drizzle/migrations/0042_blushing_sinister_six.sql` | Create |
| `apps/server/src/shared/database/drizzle/migrations/0042_case_checklist_items.sql` | Remove |
| `apps/server/src/shared/database/drizzle/migrations/0043_case_checklist_document_file_name.sql` | Remove |
| `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json` | Modify |
| `apps/server/src/shared/database/drizzle/migrations/meta/0038_snapshot.json` | Modify |
| `apps/server/src/shared/database/drizzle/migrations/meta/0039_snapshot.json` | Create |
| `apps/server/src/shared/database/drizzle/migrations/meta/0040_snapshot.json` | Create |
| `apps/server/src/shared/database/drizzle/migrations/meta/0041_snapshot.json` | Create |
| `apps/server/src/shared/database/drizzle/migrations/meta/0042_snapshot.json` | Create |
| `apps/server/src/shared/database/drizzle/migrations/tests/formalization-signature-configuration-migration.test.ts` | Create |
| `apps/server/src/shared/database/drizzle/models/communication-channel-model.ts` | Create |
| `apps/server/src/shared/database/drizzle/models/stored-file-model.ts` | Create |
| `apps/server/src/shared/database/drizzle/repositories/drizzle-stored-files-repository.ts` | Create |
| `apps/server/src/shared/database/drizzle/schema.ts` | Modify |
| `apps/server/src/shared/database/dynamic-forms-seed-data.ts` | Modify |
| `apps/server/src/shared/database/seed.module.ts` | Modify |
| `apps/server/src/shared/database/seed.ts` | Modify |
| `apps/server/src/shared/messaging/inngest/inngest-fixture.ts` | Create |
| `apps/server/src/shared/provision/constants/provision-providers.ts` | Modify |
| `apps/server/src/shared/provision/env/env-provider.test.ts` | Remove |
| `apps/server/src/shared/provision/env/env-provider.ts` | Modify |
| `apps/server/src/shared/provision/file-storage/fake-file-storage-provider.ts` | Remove |
| `apps/server/src/shared/provision/file-storage/supabase-file-storage-provider.ts` | Create |
| `apps/server/src/shared/provision/provision.module.ts` | Modify |
| `apps/server/src/shared/provision/storage/supabase-storage-fixture.ts` | Create |
| `apps/server/src/shared/provision/storage/supabase-storage-provider.test.ts` | Remove |
| `apps/server/src/shared/provision/storage/supabase-storage-provider.ts` | Modify |
| `apps/server/src/shared/rest/configure-cors.ts` | Create |
| `apps/server/src/shared/rest/controllers/list-dynamic-forms.controller.ts` | Modify |
| `apps/server/src/shared/rest/filters/global-error-handler.ts` | Modify |
| `apps/server/src/shared/rest/signing-gateway-headers.ts` | Create |
| `apps/server/tsconfig.build.json` | Modify |
| `apps/server/vitest.config.mts` | Modify |
| `apps/server/vitest.inngest.config.mts` | Create |
| `apps/web/.dependency-cruiser.mjs` | Modify |
| `apps/web/.env.example` | Modify |
| `apps/web/package.json` | Modify |
| `apps/web/playwright.config.ts` | Modify |
| `apps/web/src/constants/routes.ts` | Modify |
| `apps/web/src/middlewares/redirect-authenticated-middleware.ts` | Modify |
| `apps/web/src/middlewares/require-auth-middleware.ts` | Modify |
| `apps/web/src/middlewares/tests/redirect-authenticated-middleware.test.ts` | Create |
| `apps/web/src/provision/signing-gateway-csrf-store.ts` | Create |
| `apps/web/src/rest/axios/axios-rest-client.ts` | Modify |
| `apps/web/src/rest/axios/signing-gateway-rest-client.ts` | Create |
| `apps/web/src/rest/services/case-management-service.ts` | Remove |
| `apps/web/src/rest/services/document-engine-service.ts` | Modify |
| `apps/web/src/rest/services/document-production-service.ts` | Modify |
| `apps/web/src/rest/services/document-validation-service.ts` | Modify |
| `apps/web/src/rest/services/dynamic-form-service.ts` | Modify |
| `apps/web/src/rest/services/formalization-service.ts` | Create |
| `apps/web/src/rest/services/signing-gateway-service.ts` | Create |
| `apps/web/src/rest/services/tests/formalization-service.test.ts` | Create |
| `apps/web/src/rest/services/tests/signing-gateway-service.test.ts` | Create |
| `apps/web/src/routes/advogado/meus-casos_/$caseId/checklist/$checklistItemId.tsx` | Remove |
| `apps/web/src/routes/advogado/meus-casos.tsx` | Create |
| `apps/web/src/routes/advogado/meus-casos/$caseId.tsx` | Remove |
| `apps/web/src/routes/advogado/meus-casos/index.tsx` | Remove |
| `apps/web/src/routes/assinaturas/acesso/index.tsx` | Create |
| `apps/web/src/routes/caixa-de-documentos/$fileId.tsx` | Modify |
| `apps/web/src/routes/caixa-de-documentos/index.tsx` | Modify |
| `apps/web/src/routes/formalizacoes/$formalizationId/configuracao-envio/index.tsx` | Create |
| `apps/web/src/routes/formalizacoes/$formalizationId/documentos/$documentVersionId.tsx` | Create |
| `apps/web/src/routes/formalizacoes/$formalizationId/index.tsx` | Create |
| `apps/web/src/routes/formalizacoes/$formalizationId/route.tsx` | Create |
| `apps/web/src/routes/formalizacoes/route.tsx` | Create |
| `apps/web/src/routes/login/index.tsx` | Modify |
| `apps/web/src/routes/lotes-documentos/$fileId.tsx` | Modify |
| `apps/web/src/routeTree.gen.ts` | Modify |
| `apps/web/src/ui/consultation/hooks/use-consultation-attendance-action.ts` | Create |
| `apps/web/src/ui/consultation/hooks/use-consultation-attendance-actions.ts` | Remove |
| `apps/web/src/ui/consultation/hooks/use-consultation-legal-catalog-query.ts` | Create |
| `apps/web/src/ui/consultation/hooks/use-consultation-status-action.ts` | Create |
| `apps/web/src/ui/consultation/hooks/use-consultation-status-actions.ts` | Remove |
| `apps/web/src/ui/consultation/hooks/use-consultation.ts` | Modify |
| `apps/web/src/ui/consultation/widgets/pages/consultation-page/attendance-form/use-attendance-form.ts` | Modify |
| `apps/web/src/ui/consultation/widgets/pages/consultation-page/tests/attendance-form.test.tsx` | Modify |
| `apps/web/src/ui/consultation/widgets/pages/consultation-page/tests/consultation-details.test.tsx` | Modify |
| `apps/web/src/ui/document-engine/hooks/use-document-batches-triage-query.ts` | Remove |
| `apps/web/src/ui/document-engine/hooks/use-document-validation-documents-query.ts` | Modify |
| `apps/web/src/ui/document-engine/hooks/use-record-document-validation-decision-action.ts` | Modify |
| `apps/web/src/ui/document-engine/widgets/components/document-file-preview/index.tsx` | Remove |
| `apps/web/src/ui/document-engine/widgets/components/document-file-preview/tests/document-file-preview.test.tsx` | Remove |
| `apps/web/src/ui/document-engine/widgets/components/document-file-preview/tests/use-document-file-preview.test.ts` | Remove |
| `apps/web/src/ui/document-engine/widgets/components/document-file-preview/use-document-file-preview.ts` | Remove |
| `apps/web/src/ui/document-engine/widgets/pages/document-analysis-page/index.tsx` | Modify |
| `apps/web/src/ui/document-engine/widgets/pages/document-analysis-page/pdf-viewer-panel/index.tsx` | Modify |
| `apps/web/src/ui/document-engine/widgets/pages/document-analysis-page/pdf-viewer-panel/tests/pdf-viewer-panel.test.tsx` | Modify |
| `apps/web/src/ui/document-engine/widgets/pages/document-analysis-page/read-only-validated-panel/index.tsx` | Remove |
| `apps/web/src/ui/document-engine/widgets/pages/document-analysis-page/read-only-validated-panel/tests/read-only-validated-panel.test.tsx` | Remove |
| `apps/web/src/ui/document-engine/widgets/pages/document-analysis-page/tests/document-analysis-page.test.tsx` | Modify |
| `apps/web/src/ui/document-engine/widgets/pages/document-analysis-page/tests/use-document-analysis.test.ts` | Modify |
| `apps/web/src/ui/document-engine/widgets/pages/document-analysis-page/use-document-analysis.ts` | Modify |
| `apps/web/src/ui/document-engine/widgets/pages/document-inbox/index.tsx` | Modify |
| `apps/web/src/ui/document-engine/widgets/pages/document-inbox/tests/use-document-inbox.test.ts` | Modify |
| `apps/web/src/ui/document-engine/widgets/pages/document-inbox/use-document-inbox.ts` | Modify |
| `apps/web/src/ui/document-engine/widgets/pages/document-viewer/index.tsx` | Modify |
| `apps/web/src/ui/document-engine/widgets/pages/document-viewer/tests/document-viewer.test.tsx` | Modify |
| `apps/web/src/ui/document-engine/widgets/pages/document-viewer/tests/use-document-viewer.test.ts` | Modify |
| `apps/web/src/ui/document-engine/widgets/pages/document-viewer/use-document-viewer.ts` | Modify |
| `apps/web/src/ui/document-production/hooks/tests/use-generate-consultation-document-action.test.tsx` | Remove |
| `apps/web/src/ui/document-production/hooks/use-document-catalog-query.ts` | Create |
| `apps/web/src/ui/document-production/hooks/use-document-specification-action.ts` | Create |
| `apps/web/src/ui/document-production/hooks/use-document-specification-query.ts` | Create |
| `apps/web/src/ui/document-production/hooks/use-document-specifications-query.ts` | Create |
| `apps/web/src/ui/document-production/hooks/use-document-topics-query.ts` | Create |
| `apps/web/src/ui/document-production/hooks/use-update-document-access-action.ts` | Remove |
| `apps/web/src/ui/document-production/widgets/components/document-badge/change-document-access-dialog.tsx` | Remove |
| `apps/web/src/ui/document-production/widgets/components/document-badge/document-access-badge.tsx` | Remove |
| `apps/web/src/ui/document-production/widgets/components/document-package/document-package-list/index.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-package/document-package-list/tests/document-package-list.test.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-package/document-package-list/tests/use-document-package-list.test.ts` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-package/document-package-list/use-document-package-list.ts` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-package/document-package-row/index.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-package/document-package-row/tests/document-package-row.test.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-package/document-package-row/tests/use-document-package-row.test.ts` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-package/document-package-row/use-document-package-row.ts` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-package/index.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-package/tests/document-package.test.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-package/tests/use-document-package.test.ts` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-package/types.ts` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-package/use-document-package.ts` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-review-dialogs/cancel-manual-edit-dialog/index.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-review-dialogs/document-version-history-dialog/index.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-review-dialogs/regenerate-document-version-dialog/index.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-review-dialogs/reject-document-version-dialog/index.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-review-dialogs/save-manual-version-dialog/index.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-review/document-review-decision-bar.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-review/document-review-header.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-review/index.ts` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-review/tests/document-review.test.tsx` | Create |
| `apps/web/src/ui/document-production/widgets/components/document-review/types.ts` | Create |
| `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/cancel-manual-edit-dialog/index.tsx` | Remove |
| `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/consultation-document-review-header/index.tsx` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-decision-bar/index.tsx` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-history-dialog/index.tsx` | Remove |
| `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/index.tsx` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/regenerate-document-version-dialog/index.tsx` | Remove |
| `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/reject-document-version-dialog/index.tsx` | Remove |
| `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/save-manual-version-dialog/index.tsx` | Remove |
| `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/consultation-document-list/index.tsx` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/consultation-document-row/index.tsx` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/index.tsx` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/select-consultation-documents-dialog/index.tsx` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/tests/consultation-documents-page.test.tsx` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/tests/use-consultation-documents-page.test.ts` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/use-consultation-documents-page.ts` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/document-specification-page/tests/use-document-specification-page.test.ts` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/document-specification-page/use-document-specification-actions.ts` | Remove |
| `apps/web/src/ui/document-production/widgets/pages/document-specification-page/use-document-specification-page.ts` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/document-specifications-page/tests/document-specifications-page.test.tsx` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/document-specifications-page/tests/use-document-specifications-page.test.ts` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/document-specifications-page/use-document-catalog-query.ts` | Remove |
| `apps/web/src/ui/document-production/widgets/pages/document-specifications-page/use-document-specifications-page.ts` | Modify |
| `apps/web/src/ui/document-production/widgets/pages/document-specifications-page/use-document-specifications-query.ts` | Remove |
| `apps/web/src/ui/document-production/widgets/pages/document-specifications-page/use-document-topics-query.ts` | Remove |
| `apps/web/src/ui/formalization/hooks/tests/use-formalization-signature-configuration-action.test.ts` | Create |
| `apps/web/src/ui/formalization/hooks/tests/use-formalization-signature-sending-action.test.ts` | Create |
| `apps/web/src/ui/formalization/hooks/tests/use-signature-document-query.test.ts` | Create |
| `apps/web/src/ui/formalization/hooks/tests/use-signing-package-actions.test.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-acknowledge-signature-document-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-close-formalization-without-contract-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-close-signature-result-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-establish-collaborator-signing-session-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-exchange-signature-invitation-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-formalization-document-production-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-formalization-document-review-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-formalization-document-version-query.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-formalization-query.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-formalization-signature-configuration-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-formalization-signature-sending-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-request-signature-otp-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-save-formalization-contract-form-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-signature-channels-query.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-signature-document-query.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-signature-result-query.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-signing-gateway-context-query.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-start-formalization-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-start-signing-action.ts` | Create |
| `apps/web/src/ui/formalization/hooks/use-verify-signature-otp-action.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-document-review-page/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-document-review-page/tests/formalization-document-review-page.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-document-review-page/tests/use-formalization-document-review-page.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-document-review-page/use-formalization-document-review-page.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/close-without-contract-action/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/close-without-contract-action/tests/close-without-contract-action.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/close-without-contract-action/tests/use-close-without-contract-action.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/close-without-contract-action/use-close-without-contract-action.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/close-without-contract-dialog/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/close-without-contract-dialog/tests/close-without-contract-dialog.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/close-without-contract-dialog/tests/use-close-without-contract-dialog.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/close-without-contract-dialog/use-close-without-contract-dialog.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/commercial-conditions-card/close-form-confirmation-dialog/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/commercial-conditions-card/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/commercial-conditions-card/reopen-form-confirmation-dialog/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/commercial-conditions-card/tests/use-commercial-conditions-card.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/commercial-conditions-card/use-commercial-conditions-card.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/document-package-confirmation-dialog/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-context-header/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-documents-section/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-documents-section/tests/formalization-documents-section.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-documents-section/tests/use-formalization-documents-section.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-documents-section/use-formalization-documents-section.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration-summary/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration-summary/tests/formalization-sending-configuration-summary.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration-summary/tests/use-formalization-sending-configuration-summary.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration-summary/use-formalization-sending-configuration-summary.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/remove-signature-signatory-dialog/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/candidate-dialog/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/candidate-dialog/tests/candidate-dialog.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/candidate-dialog/tests/use-candidate-dialog.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/candidate-dialog/use-candidate-dialog.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/signatory-card/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/signatory-card/tests/signatory-card.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/signatory-card/tests/use-signatory-card.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/signatory-card/use-signatory-card.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/tests/signatories-tab.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/tests/use-signatories-tab.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signatories-tab/use-signatories-tab.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/remove-all-signature-fields-dialog/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/remove-all-signature-fields-dialog/tests/remove-all-signature-fields-dialog.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/remove-all-signature-fields-dialog/tests/use-remove-all-signature-fields-dialog.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/remove-all-signature-fields-dialog/use-remove-all-signature-fields-dialog.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/signature-fields-progress-dialog/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/signature-fields-progress-dialog/tests/signature-fields-progress-dialog.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/signature-fields-progress-dialog/tests/use-signature-fields-progress-dialog.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/signature-fields-progress-dialog/use-signature-fields-progress-dialog.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/tests/signature-fields-tab.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/tests/use-signature-fields-tab.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/signature-fields-tab/use-signature-fields-tab.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/tests/formalization-sending-configuration.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/tests/use-formalization-sending-configuration.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-sending-configuration/use-formalization-sending-configuration.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/formalization-state-panels/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/select-formalization-documents-dialog/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-page/use-formalization-page.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-sending-configuration/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/formalization-sending-configuration/use-formalization-sending-configuration-page.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/channel-selection-step/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/channel-selection-step/tests/channel-selection-step.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/channel-selection-step/tests/use-channel-selection-step.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/channel-selection-step/use-channel-selection-step.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/collaborator-login-step/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/collaborator-login-step/tests/collaborator-login-step.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/collaborator-login-step/tests/use-collaborator-login-step.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/collaborator-login-step/use-collaborator-login-step.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/signing-document-viewer/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/signing-document-viewer/tests/signing-document-viewer.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/signing-document-viewer/tests/use-signing-document-viewer.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/signing-document-viewer/use-signing-document-viewer.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/tests/document-reading-step.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/tests/use-document-reading-step.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/document-reading-step/use-document-reading-step.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/invitation-access-step/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/invitation-access-step/tests/invitation-access-step.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/invitation-access-step/tests/use-invitation-access-step.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/invitation-access-step/use-invitation-access-step.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/otp-code-input/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/otp-code-input/tests/otp-code-input.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/otp-code-input/tests/use-otp-code-input.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/otp-code-input/use-otp-code-input.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/tests/otp-verification-step.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/tests/use-otp-verification-step.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/otp-verification-step/use-otp-verification-step.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/provider-signing-step/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/provider-signing-step/tests/provider-signing-step.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/provider-signing-step/tests/use-provider-signing-step.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/provider-signing-step/use-provider-signing-step.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-confirmed-step/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-confirmed-step/tests/signature-confirmed-step.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-confirmed-step/tests/use-signature-confirmed-step.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-confirmed-step/use-signature-confirmed-step.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-submitted-step/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-submitted-step/tests/signature-submitted-step.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-submitted-step/tests/use-signature-submitted-step.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signature-submitted-step/use-signature-submitted-step.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signing-unavailable-step/index.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signing-unavailable-step/tests/signing-unavailable-step.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signing-unavailable-step/tests/use-signing-unavailable-step.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/signing-unavailable-step/use-signing-unavailable-step.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/tests/signing-gateway-page.test.tsx` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/tests/use-signing-gateway-page.test.ts` | Create |
| `apps/web/src/ui/formalization/widgets/pages/signing-gateway-page/use-signing-gateway-page.ts` | Create |
| `apps/web/src/ui/identity/hooks/use-client-registration-actions.ts` | Create |
| `apps/web/src/ui/identity/hooks/use-complete-collaborator-invite-action.ts` | Create |
| `apps/web/src/ui/identity/hooks/use-consultation-action.ts` | Create |
| `apps/web/src/ui/identity/hooks/use-scheduling-query.ts` | Create |
| `apps/web/src/ui/identity/hooks/use-send-communication-action.ts` | Create |
| `apps/web/src/ui/identity/hooks/use-send-communication-mutation.ts` | Remove |
| `apps/web/src/ui/identity/hooks/use-sign-in-action.ts` | Modify |
| `apps/web/src/ui/identity/widgets/components/collaborator-register-dialog/tests/collaborator-register-dialog.test.tsx` | Modify |
| `apps/web/src/ui/identity/widgets/pages/client-details-page/client-communications-tab/tests/client-communications-tab.test.tsx` | Modify |
| `apps/web/src/ui/identity/widgets/pages/client-details-page/my-cases-tab/case-details/bottom-details/tests/bottom-details.test.tsx` | Modify |
| `apps/web/src/ui/identity/widgets/pages/clients-list-page/tests/clients-list-page.test.tsx` | Modify |
| `apps/web/src/ui/identity/widgets/pages/collaborator-details-page/tests/collaborator-details-page.test.tsx` | Modify |
| `apps/web/src/ui/identity/widgets/pages/collaborator-invite-page/tests/collaborator-invite-page.test.tsx` | Modify |
| `apps/web/src/ui/identity/widgets/pages/collaborator-invite-page/tests/use-collaborator-invite-page.test.ts` | Modify |
| `apps/web/src/ui/identity/widgets/pages/collaborator-invite-page/use-collaborator-invite-page.ts` | Modify |
| `apps/web/src/ui/identity/widgets/pages/collaborators-page/tests/collaborators-page.test.tsx` | Modify |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/communication.tsx` | Modify |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/case-page-data.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-document-status.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-dossier-tab/decision-reason-dialog/index.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-dossier-tab/index.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-dossier-tab/tests/checklist-dossier-tab.test.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-dossier-tab/tests/use-checklist-dossier-tab.test.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-dossier-tab/use-checklist-dossier-tab.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-item-detail-page/checklist-item-history-events.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-item-detail-page/components/detail-header.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-item-detail-page/components/history-panel.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-item-detail-page/components/main-panel.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-item-detail-page/components/side-panel.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-item-detail-page/index.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-item-detail-page/tests/checklist-item-detail-page.test.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-item-detail-page/tests/use-checklist-item-detail-page.test.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-item-detail-page/use-checklist-item-detail-page.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-style.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/hooks/use-case-checklist.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/index.tsx` | Modify |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/overview-tab/index.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/types.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-case-page/use-my-case-page.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-cases-list-page/index.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-cases-list-page/tests/my-cases-list-page.test.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-cases-list-page/tests/use-my-cases-list-page.test.tsx` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-cases-list-page/types.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/my-cases-list-page/use-my-cases-list-page.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/schedule.tsx` | Modify |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/use-schedule.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/lawyer-page/use-scheduling.ts` | Remove |
| `apps/web/src/ui/identity/widgets/pages/sign-in-page/index.tsx` | Modify |
| `apps/web/src/ui/identity/widgets/pages/sign-in-page/tests/use-sign-in-page.test.ts` | Modify |
| `apps/web/src/ui/identity/widgets/pages/sign-in-page/use-sign-in-page.ts` | Modify |
| `apps/web/src/ui/intake/hooks/tests/use-legal-catalog-queries.test.tsx` | Create |
| `apps/web/src/ui/intake/hooks/use-close-intake-without-contract-action.ts` | Create |
| `apps/web/src/ui/intake/hooks/use-intake-details-query.ts` | Create |
| `apps/web/src/ui/intake/hooks/use-intake-lawyers-query.ts` | Create |
| `apps/web/src/ui/intake/hooks/use-intakes-query.ts` | Create |
| `apps/web/src/ui/intake/hooks/use-legal-areas-query.ts` | Create |
| `apps/web/src/ui/intake/hooks/use-legal-topics-query.ts` | Create |
| `apps/web/src/ui/intake/hooks/use-register-intake-action.ts` | Create |
| `apps/web/src/ui/intake/hooks/use-update-intake-action.ts` | Create |
| `apps/web/src/ui/intake/widgets/pages/intake-details-page/intake-details-content/index.tsx` | Modify |
| `apps/web/src/ui/intake/widgets/pages/intake-details-page/intake-edit-dialog/tests/intake-edit-dialog.test.tsx` | Modify |
| `apps/web/src/ui/intake/widgets/pages/intake-details-page/intake-edit-dialog/use-intake-edit-dialog.ts` | Modify |
| `apps/web/src/ui/intake/widgets/pages/intake-details-page/tests/intake-details-page.test.tsx` | Modify |
| `apps/web/src/ui/intake/widgets/pages/intake-details-page/use-intake-details-page.ts` | Modify |
| `apps/web/src/ui/intake/widgets/pages/intake-details-page/use-intake-details-query.ts` | Remove |
| `apps/web/src/ui/intake/widgets/pages/intakes-page/tests/use-intakes-page.test.ts` | Modify |
| `apps/web/src/ui/intake/widgets/pages/intakes-page/use-intakes-page.ts` | Modify |
| `apps/web/src/ui/intake/widgets/pages/intakes-page/use-intakes-query.ts` | Remove |
| `apps/web/src/ui/intake/widgets/pages/new-intake-page/decision-step/tests/use-lawyer-selector-dialog.test.tsx` | Modify |
| `apps/web/src/ui/intake/widgets/pages/new-intake-page/decision-step/use-lawyer-selector-dialog.ts` | Modify |
| `apps/web/src/ui/intake/widgets/pages/new-intake-page/demand-step/tests/use-legal-catalog-queries.test.tsx` | Remove |
| `apps/web/src/ui/intake/widgets/pages/new-intake-page/demand-step/use-demand-step.ts` | Modify |
| `apps/web/src/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-areas-query.ts` | Remove |
| `apps/web/src/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-topics-query.ts` | Remove |
| `apps/web/src/ui/intake/widgets/pages/new-intake-page/tests/new-intake-page.test.tsx` | Modify |
| `apps/web/src/ui/intake/widgets/pages/new-intake-page/tests/use-new-intake.test.ts` | Modify |
| `apps/web/src/ui/intake/widgets/pages/new-intake-page/use-new-intake.ts` | Modify |
| `apps/web/src/ui/intake/widgets/pages/new-intake-page/use-register-intake-action.ts` | Remove |
| `apps/web/src/ui/shadcn/badge.tsx` | Modify |
| `apps/web/src/ui/shadcn/input-otp.tsx` | Create |
| `apps/web/src/ui/shadcn/tabs.tsx` | Modify |
| `apps/web/src/ui/shared/contexts/rest-context/tests/rest-context.test.tsx` | Modify |
| `apps/web/src/ui/shared/contexts/rest-context/types/rest-context-value.ts` | Modify |
| `apps/web/src/ui/shared/contexts/rest-context/use-rest-context-provider.ts` | Modify |
| `apps/web/src/ui/shared/hooks/use-dynamic-form-options-query.ts` | Create |
| `apps/web/src/ui/shared/hooks/use-navigation.ts` | Modify |
| `apps/web/src/ui/shared/hooks/use-sign-out-action.ts` | Create |
| `apps/web/src/ui/shared/styles/global.css` | Modify |
| `apps/web/src/ui/shared/widgets/components/client-register-dialog/tests/client-register-dialog.test.tsx` | Modify |
| `apps/web/src/ui/shared/widgets/components/client-register-dialog/tests/use-client-register-dialog.test.ts` | Modify |
| `apps/web/src/ui/shared/widgets/components/client-register-dialog/use-client-register-dialog.ts` | Modify |
| `apps/web/src/ui/shared/widgets/dynamic-form/dynamic-form-fields/index.tsx` | Modify |
| `apps/web/src/ui/shared/widgets/dynamic-form/select-form/index.tsx` | Modify |
| `apps/web/src/ui/shared/widgets/dynamic-form/select-form/tests/select-form.test.tsx` | Modify |
| `apps/web/src/ui/shared/widgets/dynamic-form/select-form/use-select-form.ts` | Modify |
| `apps/web/src/ui/shared/widgets/layouts/app-layout/sidebar/index.tsx` | Modify |
| `apps/web/src/ui/shared/widgets/layouts/app-layout/sidebar/use-sign-out-action.ts` | Remove |
| `apps/web/src/ui/shared/widgets/layouts/app-layout/tests/app-layout.test.tsx` | Modify |
| `apps/web/src/ui/shared/widgets/layouts/root-layout/index.tsx` | Modify |
| `apps/web/src/ui/shared/widgets/pages/landing-page/index.tsx` | Modify |
| `apps/web/tests/fixtures/document-production-fixture.ts` | Modify |
| `apps/web/tests/routes/document-production/consultation-document-version.test.tsx` | Modify |
| `apps/web/tests/routes/document-production/consultation-documents.index.test.tsx` | Modify |
| `apps/web/tests/routes/formalization/formalization-sending-configuration.test.tsx` | Create |
| `apps/web/tests/routes/formalization/formalization.index.test.tsx` | Create |
| `apps/web/tests/routes/formalization/signing-gateway.test.tsx` | Create |
| `apps/web/tests/routes/identity/login.index.test.tsx` | Modify |
| `apps/web/vite.config.ts` | Modify |
| `biome.json` | Modify |
| `design/hms.pen` | Modify |
| `docker-compose.yaml` | Modify |
| `Dockerfile.server` | Modify |
| `documentation/agents/builder-agent.md` | Modify |
| `documentation/agents/implementation-reviewer-agent.md` | Create |
| `documentation/agents/reviewer-agent.md` | Remove |
| `documentation/agents/searcher-agent.md` | Remove |
| `documentation/agents/spec-reviewer-agent.md` | Create |
| `documentation/architecture.md` | Modify |
| `documentation/diagrams/client-collaborator-signing-workflows.excalidraw` | Create |
| `documentation/diagrams/hms-signing-gateway-technical-workflows.excalidraw` | Create |
| `documentation/diagrams/pr-creation-review-workflow.excalidraw` | Modify |
| `documentation/features/document-production/consultation-document-production-ui/evaluation.md` | Modify |
| `documentation/features/document-production/consultation-document-production-ui/plan.md` | Modify |
| `documentation/features/document-production/consultation-document-production-ui/spec.md` | Modify |
| `documentation/features/document-production/document-specification-page/plan.md` | Modify |
| `documentation/features/document-production/document-specification-page/spec.md` | Modify |
| `documentation/features/document-production/document-specifications-page/plan.md` | Modify |
| `documentation/features/document-production/document-specifications-page/spec.md` | Modify |
| `documentation/features/document-production/formalization-document-production/evaluation.md` | Modify |
| `documentation/features/document-production/formalization-document-production/plan.md` | Modify |
| `documentation/features/document-production/formalization-document-production/spec.md` | Modify |
| `documentation/features/formalization/formalization-signature-flow/design/GlZGA.png` | Create |
| `documentation/features/formalization/formalization-signature-flow/design/HcT8k.png` | Create |
| `documentation/features/formalization/formalization-signature-flow/design/manifest.md` | Create |
| `documentation/features/formalization/formalization-signature-flow/design/MC4E2.png` | Create |
| `documentation/features/formalization/formalization-signature-flow/design/nI1B0.png` | Create |
| `documentation/features/formalization/formalization-signature-flow/design/NSYug.png` | Create |
| `documentation/features/formalization/formalization-signature-flow/design/qOfh6.png` | Create |
| `documentation/features/formalization/formalization-signature-flow/design/sxENj.png` | Create |
| `documentation/features/formalization/formalization-signature-flow/design/Vx43H.png` | Create |
| `documentation/features/formalization/formalization-signature-flow/design/YWfhi.png` | Create |
| `documentation/features/formalization/formalization-signature-flow/evaluation.md` | Create |
| `documentation/features/formalization/formalization-signature-flow/plan.md` | Create |
| `documentation/features/formalization/formalization-signature-flow/spec.md` | Create |
| `documentation/features/formalization/signing-gateway/design/01-access-invitation.png` | Create |
| `documentation/features/formalization/signing-gateway/design/02-select-channel.png` | Create |
| `documentation/features/formalization/signing-gateway/design/03-verify-otp.png` | Create |
| `documentation/features/formalization/signing-gateway/design/04-read-document.png` | Create |
| `documentation/features/formalization/signing-gateway/design/05-confirm-signature.png` | Create |
| `documentation/features/formalization/signing-gateway/design/06-signature-submitted.png` | Create |
| `documentation/features/formalization/signing-gateway/design/07-signature-confirmed.png` | Create |
| `documentation/features/formalization/signing-gateway/design/08-internal-tracking-out-of-scope.png` | Create |
| `documentation/features/formalization/signing-gateway/design/09-collaborator-read.png` | Create |
| `documentation/features/formalization/signing-gateway/design/10-collaborator-confirm.png` | Create |
| `documentation/features/formalization/signing-gateway/design/11-access-unavailable.png` | Create |
| `documentation/features/formalization/signing-gateway/design/12-no-authorized-channel.png` | Create |
| `documentation/features/formalization/signing-gateway/design/13-otp-invalid-expired.png` | Create |
| `documentation/features/formalization/signing-gateway/design/14-otp-attempt-limit.png` | Create |
| `documentation/features/formalization/signing-gateway/design/HcT8k.png` | Create |
| `documentation/features/formalization/signing-gateway/design/manifest.md` | Create |
| `documentation/features/formalization/signing-gateway/design/MC4E2.png` | Create |
| `documentation/features/formalization/signing-gateway/design/nI1B0.png` | Create |
| `documentation/features/formalization/signing-gateway/design/NSYug.png` | Create |
| `documentation/features/formalization/signing-gateway/design/qOfh6.png` | Create |
| `documentation/features/formalization/signing-gateway/design/sxENj.png` | Create |
| `documentation/features/formalization/signing-gateway/design/Vx43H.png` | Create |
| `documentation/features/formalization/signing-gateway/design/YWfhi.png` | Create |
| `documentation/features/formalization/signing-gateway/evaluation.md` | Create |
| `documentation/features/formalization/signing-gateway/plan.md` | Create |
| `documentation/features/formalization/signing-gateway/spec.md` | Create |
| `documentation/features/identity/client-registration/specs/client-register-dialog-spec.md` | Modify |
| `documentation/features/identity/collaborators-page/plan.md` | Modify |
| `documentation/features/identity/collaborators-page/spec.md` | Modify |
| `documentation/infrastructure.md` | Modify |
| `documentation/modules.md` | Modify |
| `documentation/prompts/conclude-spec-prompt.md` | Modify |
| `documentation/prompts/create-bug-report-prompt.md` | Modify |
| `documentation/prompts/create-jira-feat-ticket.md` | Modify |
| `documentation/prompts/create-plan-prompt.md` | Modify |
| `documentation/prompts/create-pr-prompt.md` | Modify |
| `documentation/prompts/create-prd-prompt.md` | Create |
| `documentation/prompts/create-spec-prompt.md` | Modify |
| `documentation/prompts/grilling-prompt.md` | Create |
| `documentation/prompts/implement-spec-prompt.md` | Modify |
| `documentation/rules/code-conventions-rules.md` | Modify |
| `documentation/rules/core-package-rules.md` | Modify |
| `documentation/rules/database-layer-rules.md` | Modify |
| `documentation/rules/jobs-testing-rules.md` | Create |
| `documentation/rules/messaging-layer-rules.md` | Modify |
| `documentation/rules/rules.md` | Modify |
| `documentation/rules/sdd-rules.md` | Remove |
| `documentation/rules/ui-layer-rules.md` | Modify |
| `documentation/rules/use-case-testing-rules.md` | Modify |
| `documentation/rules/validation-package-rules.md` | Modify |
| `documentation/rules/web-app-routing-rules.md` | Modify |
| `documentation/rules/widget-testing-rules.md` | Modify |
| `documentation/sdd.md` | Modify |
| `documentation/tooling.md` | Modify |
| `package.json` | Modify |
| `packages/core/package.json` | Modify |
| `packages/core/src/case-management/domain/entities/case-checklist-item.ts` | Remove |
| `packages/core/src/case-management/domain/entities/fakers/index.ts` | Remove |
| `packages/core/src/case-management/domain/entities/fakers/legal-case-faker.ts` | Remove |
| `packages/core/src/case-management/domain/entities/index.ts` | Modify |
| `packages/core/src/case-management/domain/entities/legal-case-summary.ts` | Remove |
| `packages/core/src/case-management/domain/entities/legal-case.ts` | Modify |
| `packages/core/src/case-management/domain/errors/case-checklist-gate-review-error.ts` | Remove |
| `packages/core/src/case-management/domain/errors/index.ts` | Remove |
| `packages/core/src/case-management/domain/errors/legal-case-not-found-error.ts` | Remove |
| `packages/core/src/case-management/domain/structures/case-checklist-gate-decision.ts` | Remove |
| `packages/core/src/case-management/domain/structures/case-checklist-gate.ts` | Remove |
| `packages/core/src/case-management/domain/structures/case-checklist-item-status.ts` | Remove |
| `packages/core/src/case-management/domain/structures/case-dossier-gate.ts` | Remove |
| `packages/core/src/case-management/domain/structures/index.ts` | Modify |
| `packages/core/src/case-management/domain/structures/legal-case-status.ts` | Modify |
| `packages/core/src/case-management/interfaces/case-checklist-items-repository.ts` | Remove |
| `packages/core/src/case-management/interfaces/case-management-service.ts` | Remove |
| `packages/core/src/case-management/interfaces/index.ts` | Modify |
| `packages/core/src/case-management/interfaces/legal-cases-repository.ts` | Modify |
| `packages/core/src/case-management/use-cases/add-case-checklist-complementary-item-use-case.ts` | Remove |
| `packages/core/src/case-management/use-cases/index.ts` | Remove |
| `packages/core/src/case-management/use-cases/list-case-checklist-use-case.ts` | Remove |
| `packages/core/src/case-management/use-cases/list-my-legal-cases-use-case.ts` | Remove |
| `packages/core/src/case-management/use-cases/mark-case-checklist-item-validated-use-case.ts` | Remove |
| `packages/core/src/case-management/use-cases/review-case-checklist-gate-use-case.ts` | Remove |
| `packages/core/src/case-management/use-cases/tests/add-case-checklist-complementary-item-use-case.test.ts` | Remove |
| `packages/core/src/case-management/use-cases/tests/list-my-legal-cases-use-case.test.ts` | Remove |
| `packages/core/src/case-management/use-cases/tests/mark-case-checklist-item-validated-use-case.test.ts` | Remove |
| `packages/core/src/case-management/use-cases/tests/review-case-checklist-gate-use-case.test.ts` | Remove |
| `packages/core/src/communication/domain/events/communication-signature-invitation-delivered-event.ts` | Create |
| `packages/core/src/communication/domain/events/communication-signature-otp-delivered-event.ts` | Create |
| `packages/core/src/communication/domain/events/index.ts` | Modify |
| `packages/core/src/communication/interfaces/send-email-message-params.ts` | Modify |
| `packages/core/src/communication/interfaces/whatsapp-provider.ts` | Modify |
| `packages/core/src/consultation/domain/structures/consultation-document-list-item.ts` | Modify |
| `packages/core/src/consultation/use-cases/replace-consultation-document-selection-use-case.ts` | Modify |
| `packages/core/src/consultation/use-cases/tests/list-consultation-documents-use-case.test.ts` | Modify |
| `packages/core/src/document-engine/domain/entities/document-validation.ts` | Modify |
| `packages/core/src/document-engine/domain/events/index.ts` | Modify |
| `packages/core/src/document-engine/domain/events/whatsapp-document-batch-received-event.ts` | Create |
| `packages/core/src/document-engine/interfaces/case-checklist-update-provider.ts` | Remove |
| `packages/core/src/document-engine/interfaces/document-batches-repository.ts` | Modify |
| `packages/core/src/document-engine/interfaces/document-validation-service.ts` | Modify |
| `packages/core/src/document-engine/interfaces/document-validations-repository.ts` | Modify |
| `packages/core/src/document-engine/interfaces/index.ts` | Modify |
| `packages/core/src/document-engine/use-cases/index.ts` | Modify |
| `packages/core/src/document-engine/use-cases/list-document-validations-use-case.ts` | Modify |
| `packages/core/src/document-engine/use-cases/list-triage-document-batches-use-case.ts` | Remove |
| `packages/core/src/document-engine/use-cases/record-document-validation-decision-use-case.ts` | Modify |
| `packages/core/src/document-engine/use-cases/tests/record-document-validation-decision-use-case.test.ts` | Modify |
| `packages/core/src/document-production/domain/entities/document.ts` | Modify |
| `packages/core/src/document-production/domain/entities/fakers/document-faker.ts` | Modify |
| `packages/core/src/document-production/interfaces/documents-repository.ts` | Modify |
| `packages/core/src/document-production/interfaces/package-documents-repository.ts` | Modify |
| `packages/core/src/document-production/use-cases/index.ts` | Modify |
| `packages/core/src/document-production/use-cases/tests/update-document-access-classification-use-case.test.ts` | Remove |
| `packages/core/src/document-production/use-cases/update-document-access-classification-use-case.ts` | Remove |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-artifact-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-cancellation-attempt-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-gateway-session-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-invitation-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-otp-challenge-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-otp-rate-reservation-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-otp-send-attempt-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-protocol-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-provider-recipient-resource-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-provider-resource-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-provisioning-attempt-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-proxy-binding-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-recipient-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-request-document-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-request-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-snapshot-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/formalization-signature-webhook-receipt-faker.ts` | Create |
| `packages/core/src/formalization/domain/entities/fakers/index.ts` | Modify |
| `packages/core/src/formalization/domain/entities/formalization-signature-artifact.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-cancellation-attempt.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-document-acknowledgement.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-gateway-session.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-invitation-send-attempt.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-invitation.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-otp-challenge.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-otp-rate-reservation.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-otp-send-attempt.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-protocol.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-provider-document-resource.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-provider-recipient-resource.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-provider-resource.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-provisioning-attempt.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-proxy-binding.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-recipient-document.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-recipient.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-request-document.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-request.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-snapshot.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization-signature-webhook-receipt.ts` | Create |
| `packages/core/src/formalization/domain/entities/formalization.ts` | Modify |
| `packages/core/src/formalization/domain/entities/index.ts` | Modify |
| `packages/core/src/formalization/domain/errors/formalization-access-denied-error.ts` | Modify |
| `packages/core/src/formalization/domain/errors/formalization-confirmation-error.ts` | Modify |
| `packages/core/src/formalization/domain/errors/formalization-document-stale-error.ts` | Modify |
| `packages/core/src/formalization/domain/errors/formalization-signature-cancellation-partial-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/formalization-signature-not-ready-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/formalization-signature-provisioning-failed-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/formalization-signature-request-conflict-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/formalization-signature-sending-forbidden-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/formalization-signature-stale-configuration-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/formalization-state-conflict-error.ts` | Modify |
| `packages/core/src/formalization/domain/errors/index.ts` | Modify |
| `packages/core/src/formalization/domain/errors/signature-channel-unavailable-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-collaborator-ineligible-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-collaborator-unassigned-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-consent-missing-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-csrf-invalid-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-device-mismatch-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-document-unavailable-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-invitation-consumed-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-invitation-expired-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-invitation-invalid-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-otp-consumed-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-otp-expired-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-otp-invalid-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-otp-locked-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-otp-rate-limited-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-otp-superseded-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-provider-unavailable-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-proxy-contract-violation-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-recipient-terminal-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-reconciliation-required-error.ts` | Create |
| `packages/core/src/formalization/domain/errors/signature-session-invalid-error.ts` | Create |
| `packages/core/src/formalization/domain/events/formalization-signature-invitation-ready-event.ts` | Create |
| `packages/core/src/formalization/domain/events/formalization-signature-otp-delivery-requested-event.ts` | Create |
| `packages/core/src/formalization/domain/events/formalization-signature-recipient-confirmed-event.ts` | Create |
| `packages/core/src/formalization/domain/events/formalization-signature-recipient-submitted-event.ts` | Create |
| `packages/core/src/formalization/domain/events/formalization-signature-recipient-terminal-event.ts` | Create |
| `packages/core/src/formalization/domain/events/formalization-signature-reconciliation-requested-event.ts` | Create |
| `packages/core/src/formalization/domain/events/formalization-signature-request-cancellation-requested-event.ts` | Create |
| `packages/core/src/formalization/domain/events/formalization-signature-request-provisioning-requested-event.ts` | Create |
| `packages/core/src/formalization/domain/events/index.ts` | Modify |
| `packages/core/src/formalization/domain/structures/acknowledge-signature-document-command.ts` | Create |
| `packages/core/src/formalization/domain/structures/cancel-formalization-signature-sending-command.ts` | Create |
| `packages/core/src/formalization/domain/structures/confirm-formalization-signature-sending-command.ts` | Create |
| `packages/core/src/formalization/domain/structures/exchange-signature-invitation-command.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-document-source-data.ts` | Modify |
| `packages/core/src/formalization/domain/structures/formalization-signature-access-status.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-artifact-kind.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-authentication-channel.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-authentication-channels.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-authentication-source.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-cancellation-attempt-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-candidate.ts` | Modify |
| `packages/core/src/formalization/domain/structures/formalization-signature-channel-kind.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-document-acknowledgement-response.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-gateway-context-response.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-gateway-context.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-gateway-document-metadata-response.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-gateway-document-response.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-gateway-document.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-gateway-documents-response.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-gateway-result-response.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-gateway-session-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-gateway-session-kind.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-invitation-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-invitation-send-attempt-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-invitation-status.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-otp-challenge-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-otp-challenge-status.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-otp-guard-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-otp-guard.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-otp-send-attempt-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-pending-result-status.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-projection-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-provider-envelope-status.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-provider-item-status.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-provider-observation.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-provider-recipient-resource-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-provider-resource-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-provisioning-attempt-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-proxy-binding-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-recipient-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-recipient-kind.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-recipient-status.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-reconciliation-reason.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-request-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-request-document-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-request-document-status.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-request-status.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-result-status.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-result.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-sending-cancellation-response.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-sending-issue-code.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-sending-issue.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-sending-review-response.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-sending-review.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-sending-status-response.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-unavailable-reason.ts` | Create |
| `packages/core/src/formalization/domain/structures/formalization-signature-webhook-receipt-changes.ts` | Create |
| `packages/core/src/formalization/domain/structures/index.ts` | Modify |
| `packages/core/src/formalization/domain/structures/request-signature-otp-command.ts` | Create |
| `packages/core/src/formalization/domain/structures/start-formalization-signing-command.ts` | Create |
| `packages/core/src/formalization/domain/structures/verify-signature-otp-command.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-service.ts` | Modify |
| `packages/core/src/formalization/interfaces/formalization-signature-artifacts-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-audit-writer.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-cancellation-attempts-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-document-acknowledgements-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-document-content-reader.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-document-metadata-reader.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-gateway-sessions-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-gateway-transaction.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-invitation-send-attempts-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-invitations-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-otp-challenges-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-otp-guards-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-otp-rate-reservations-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-otp-send-attempts-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-protocols-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-provider-document-resources-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-provider-recipient-resources-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-provider-resources-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-provisioning-attempts-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-proxy-bindings-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-recipient-documents-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-recipients-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-request-documents-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-requests-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-snapshots-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/formalization-signature-source-reader.ts` | Modify |
| `packages/core/src/formalization/interfaces/formalization-signature-webhook-receipts-repository.ts` | Create |
| `packages/core/src/formalization/interfaces/index.ts` | Modify |
| `packages/core/src/formalization/interfaces/sensitive-payload-cipher-provider.ts` | Create |
| `packages/core/src/formalization/interfaces/signature-otp-mac-provider.ts` | Create |
| `packages/core/src/formalization/interfaces/signature-provider.ts` | Create |
| `packages/core/src/formalization/interfaces/signature-secret-hasher.ts` | Create |
| `packages/core/src/formalization/interfaces/signature-secret-verifier.ts` | Create |
| `packages/core/src/formalization/interfaces/signing-gateway-service.ts` | Create |
| `packages/core/src/formalization/use-cases/acknowledge-signature-document-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/cancel-formalization-document-generation-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/cancel-formalization-signature-sending-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/close-formalization-contract-form-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/close-signature-result-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/confirm-formalization-documents-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/confirm-formalization-signature-sending-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/establish-collaborator-signing-session-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/exchange-signature-invitation-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/expire-signature-gateway-access-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/generate-formalization-document-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/get-formalization-document-selection-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/get-formalization-document-version-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/get-formalization-signature-sending-review-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/get-formalization-signature-sending-status-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/get-signature-document-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/get-signature-gateway-context-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/get-signature-result-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/index.ts` | Modify |
| `packages/core/src/formalization/use-cases/list-formalization-documents-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/list-signature-authentication-channels-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/mark-formalization-signature-invitation-delivery-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/mark-signature-otp-delivery-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/process-formalization-signature-cancellation-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/process-signature-provider-webhook-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/provision-formalization-signature-request-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/receive-signature-provider-webhook-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/reconcile-formalization-signature-invitation-deliveries-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/reconcile-formalization-signature-otp-deliveries-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/reconcile-formalization-signature-previews-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/reconcile-formalization-signature-requests-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/reconcile-signature-request-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/record-provider-submission-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/reopen-formalization-contract-form-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/replace-formalization-document-selection-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/request-signature-otp-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/review-formalization-document-version-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/save-formalization-contract-form-draft-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/save-manual-formalization-document-version-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/select-current-formalization-document-version-use-case.ts` | Modify |
| `packages/core/src/formalization/use-cases/start-formalization-signing-use-case.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/acknowledge-signature-document-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/cancel-formalization-signature-sending-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/close-signature-result-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/confirm-formalization-signature-sending-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/establish-collaborator-signing-session-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/exchange-signature-invitation-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/expire-signature-gateway-access-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/get-formalization-signature-sending-review-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/get-formalization-signature-sending-status-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/get-signature-document-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/get-signature-gateway-context-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/get-signature-result-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/list-signature-authentication-channels-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/mark-formalization-signature-invitation-delivery-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/mark-signature-otp-delivery-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/process-formalization-signature-cancellation-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/process-signature-provider-webhook-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/provision-formalization-signature-request-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/receive-signature-provider-webhook-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/reconcile-formalization-signature-invitation-deliveries-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/reconcile-formalization-signature-requests-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/reconcile-signature-request-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/record-provider-submission-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/request-signature-otp-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/start-formalization-signing-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/tests/verify-signature-otp-use-case.test.ts` | Create |
| `packages/core/src/formalization/use-cases/verify-signature-otp-use-case.ts` | Create |
| `packages/core/src/shared/domain/errors/index.ts` | Modify |
| `packages/core/src/shared/domain/errors/unauthorized-error.ts` | Remove |
| `packages/core/src/shared/interfaces/rest-client.ts` | Modify |
| `packages/core/src/shared/responses/rest-response.ts` | Modify |
| `packages/core/src/shared/use-cases/tests/validate-dynamic-form-answers-use-case.test.ts` | Modify |
| `packages/core/src/shared/use-cases/validate-dynamic-form-answers-use-case.ts` | Modify |
| `packages/validation/package.json` | Modify |
| `packages/validation/src/case-management/index.ts` | Remove |
| `packages/validation/src/case-management/schemas/case-checklist-gate-decision-schema.ts` | Remove |
| `packages/validation/src/case-management/schemas/index.ts` | Remove |
| `packages/validation/src/case-management/schemas/legal-case-schema.ts` | Remove |
| `packages/validation/src/case-management/schemas/legal-case-status-schema.ts` | Remove |
| `packages/validation/src/case-management/schemas/review-case-checklist-gate-schema.ts` | Remove |
| `packages/validation/src/document-production/schemas/index.ts` | Modify |
| `packages/validation/src/document-production/schemas/update-document-access-classification-schema.ts` | Remove |
| `packages/validation/src/formalization/index.ts` | Modify |
| `packages/validation/src/formalization/schemas/formalization-response-schema.ts` | Modify |
| `packages/validation/src/formalization/signing-gateway/acknowledge-signature-document-schema.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/documenso-webhook-schema.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/exchange-signature-invitation-schema.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/formalization-signature-sending-schema.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/index.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/request-signature-otp-schema.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/signature-gateway-channels-schema.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/signature-gateway-context-schema.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/signature-gateway-document-metadata-schema.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/signature-gateway-document-schema.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/signature-gateway-documents-schema.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/signature-gateway-event-schemas.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/signature-result-schema.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/start-signing-schema.ts` | Create |
| `packages/validation/src/formalization/signing-gateway/verify-signature-otp-schema.ts` | Create |
| `pnpm-lock.yaml` | Modify |
| `scripts/check-spec-implementation.mjs` | Create |
| `scripts/generate-documenso-certificate.mjs` | Create |
| `scripts/seed-documenso.mjs` | Create |
| `scripts/start-ngrok.js` | Modify |
| `scripts/sync-agents.sh` | Modify |
| `scripts/tests/check-spec-implementation.test.mjs` | Create |
| `skills-lock.json` | Modify |
| `supabase/config.toml` | Modify |
| `turbo.json` | Modify |
| `volumes/communication/templates/formalization-signature-invitation.html` | Create |
| `volumes/communication/templates/formalization-signature-otp.html` | Create |

No repository-only test files are added. The exact non-Web automated test files are:

```text
packages/core/src/formalization/use-cases/tests/get-formalization-signature-sending-review-use-case.test.ts
packages/core/src/formalization/use-cases/tests/confirm-formalization-signature-sending-use-case.test.ts
packages/core/src/formalization/use-cases/tests/provision-formalization-signature-request-use-case.test.ts
packages/core/src/formalization/use-cases/tests/mark-formalization-signature-invitation-delivery-use-case.test.ts
packages/core/src/formalization/use-cases/tests/reconcile-formalization-signature-invitation-deliveries-use-case.test.ts
packages/core/src/formalization/use-cases/tests/cancel-formalization-signature-sending-use-case.test.ts
packages/core/src/formalization/use-cases/tests/process-formalization-signature-cancellation-use-case.test.ts
packages/core/src/formalization/use-cases/tests/exchange-signature-invitation-use-case.test.ts
packages/core/src/formalization/use-cases/tests/get-signature-gateway-context-use-case.test.ts
packages/core/src/formalization/use-cases/tests/list-signature-authentication-channels-use-case.test.ts
packages/core/src/formalization/use-cases/tests/request-signature-otp-use-case.test.ts
packages/core/src/formalization/use-cases/tests/mark-signature-otp-delivery-use-case.test.ts
packages/core/src/formalization/use-cases/tests/verify-signature-otp-use-case.test.ts
packages/core/src/formalization/use-cases/tests/establish-collaborator-signing-session-use-case.test.ts
packages/core/src/formalization/use-cases/tests/get-signature-document-use-case.test.ts
packages/core/src/formalization/use-cases/tests/acknowledge-signature-document-use-case.test.ts
packages/core/src/formalization/use-cases/tests/start-formalization-signing-use-case.test.ts
packages/core/src/formalization/use-cases/tests/record-provider-submission-use-case.test.ts
packages/core/src/formalization/use-cases/tests/receive-signature-provider-webhook-use-case.test.ts
packages/core/src/formalization/use-cases/tests/process-signature-provider-webhook-use-case.test.ts
packages/core/src/formalization/use-cases/tests/reconcile-signature-request-use-case.test.ts
packages/core/src/formalization/use-cases/tests/get-signature-result-use-case.test.ts
packages/core/src/formalization/use-cases/tests/close-signature-result-use-case.test.ts
packages/core/src/formalization/use-cases/tests/expire-signature-gateway-access-use-case.test.ts
apps/server/src/formalization/rest/controllers/tests/exchange-signature-invitation.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/get-formalization-signature-sending-review.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/confirm-formalization-signature-sending.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/get-formalization-signature-sending-status.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/cancel-formalization-signature-sending.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/get-signature-gateway-context.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/list-signature-authentication-channels.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/request-signature-otp.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/verify-signature-otp.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/establish-collaborator-signing-session.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/list-signature-documents.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/get-signature-document-content.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/acknowledge-signature-document.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/start-signing.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/get-signature-result.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/close-signature-result.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/signing-gateway-webhook.controller.test.ts
apps/server/src/formalization/rest/controllers/tests/signing-gateway-proxy.controller.test.ts
apps/server/src/formalization/messaging/inngest/jobs/tests/process-signature-provider-webhook-job.test.ts
apps/server/src/formalization/messaging/inngest/jobs/tests/provision-formalization-signature-request-job.test.ts
apps/server/src/formalization/messaging/inngest/jobs/tests/reconcile-formalization-signature-provisioning-job.test.ts
apps/server/src/formalization/messaging/inngest/jobs/tests/reconcile-formalization-signature-invitation-deliveries-job.test.ts
apps/server/src/formalization/messaging/inngest/jobs/tests/cancel-formalization-signature-request-job.test.ts
apps/server/src/formalization/messaging/inngest/jobs/tests/reconcile-signature-request-job.test.ts
apps/server/src/formalization/messaging/inngest/jobs/tests/expire-signature-gateway-access-job.test.ts
apps/server/src/formalization/messaging/inngest/jobs/tests/reconcile-signature-otp-deliveries-job.test.ts
apps/server/src/formalization/messaging/inngest/jobs/tests/mark-formalization-signature-invitation-delivery-job.test.ts
apps/server/src/formalization/messaging/inngest/jobs/tests/mark-signature-otp-delivery-job.test.ts
apps/server/src/communication/messaging/inngest/jobs/tests/deliver-signature-otp-job.test.ts
apps/server/src/communication/messaging/inngest/jobs/tests/deliver-formalization-signature-invitation-job.test.ts
apps/server/src/communication/provision/tests/resend-email-provider.test.ts
apps/server/src/shared/database/drizzle/migrations/tests/signing-gateway-migration.test.ts
```

# 4. Validation Contract

The evaluation matrix, commands, manual evidence and rollout gates below remain the
recommended validation contract and must not be reported as passed without evidence.
For revision-12 conclusion only, MV-01 through MV-08 and the remaining manual, visual,
accessibility, staging, security, legal and operations evidence are explicitly waived
and non-blocking under the accepted-risk decision above. Package Validation schemas
receive lint, type and architecture checks only; behavior is exercised through consuming
Core, Server and Web tests. Provider, transaction, proxy and full-system evidence cannot
be replaced by mocked route coverage when those scenarios are executed later.

## Contracted test cases by file

All paths are the exact test paths in the affected-path ledger. Basenames below map
one-to-one to those paths.

| Test basename | Required cases |
| --- | --- |
| `get-formalization-signature-sending-review-use-case.test.ts` | associated/admin authorization; confirmed package; exact ready version; live consent/channel reread; immutable preview/hash; no CPF/provider/contact leakage; every blocking issue. |
| `confirm-formalization-signature-sending-use-case.test.ts` | successful graph cardinality; atomic `signatureRequestId` plus `signatureStatus=provisioning` projection; confirmation-key replay; concurrent version conflict; stale consent/preview/configuration; frozen edit state; event publication only after commit. |
| `provision-formalization-signature-request-use-case.test.ts` | one ordered multi-document envelope per request; every item/external-ID/field mapping; one technical alias per package recipient; provider e-mail disabled; real e-mail absent from Documenso; encrypted credentials; timeout-after-create reconciliation; incomplete/foreign item-map rejection; attempt-token stale worker protection. |
| `mark-formalization-signature-invitation-delivery-use-case.test.ts` | delivered/failed/duplicate result; atomic recipient/request and `signatureStatus` derivation through `recordInvitationDeliveryAndDerive`; version conflict; redacted provider message metadata. |
| `reconcile-formalization-signature-invitation-deliveries-use-case.test.ts` | bounded pending/due selection; same invitation/token attempt republished; delivered/terminal attempts skipped; retry metadata and ciphertext remain undisclosed. |
| `cancel-formalization-signature-sending-use-case.test.ts` | no-request distinction; open/partial/terminal graph; immediate invitation/session/binding revocation; actor/time; one request-level attempt for the shared envelope; idempotent replay. |
| `process-formalization-signature-cancellation-use-case.test.ts` | provider cancel/already terminal/failure; retry/lease token; confirmed evidence preservation; `deriveTerminalOutcome` receives only row-level observations plus terminal time and transaction-derives atomic terminal request/`signatureStatus`/`signatureTerminalAt` projection; editing unlock only after convergence. |
| `exchange-signature-invitation-use-case.test.ts` | valid/invalid/expired/consumed token; two-call race; generic error; raw token never reaches repository writes or broker. |
| `get-signature-gateway-context-use-case.test.ts` | every GET-safe discriminated step with a fresh returned CSRF value; optimistic CSRF-hash rotation and conflict; expired/revoked/device-mismatch; pre-auth redaction; terminal result narrowing; refresh repopulates the Web-memory CSRF value; `signing` with one matching active binding returns fully acknowledged reading recovery and never exposes or rotates a proxy alias on GET. |
| `list-signature-authentication-channels-use-case.test.ts` | one current e-mail consent; WhatsApp excluded; revoked consent; masked-only value; no-channel result. |
| `request-signature-otp-use-case.test.ts` | newest-only challenge; cooldown; invitation/IP rolling windows; consent race; zero-or-one e-mail tuple; encrypted ledger; direct event publication. |
| `mark-signature-otp-delivery-use-case.test.ts` | delivery activates once; failure never activates; duplicate result idempotency; retry metadata redaction. |
| `verify-signature-otp-use-case.test.ts` | exact ASCII digits; constant-time verifier path; expiry/supersession; failed increments; fifth-attempt lock; one-use race; atomic session rotation. |
| `establish-collaborator-signing-session-use-case.test.ts` | exact assignee; active/inactive; three permitted profiles; wrong person/profile/assignment; current revalidation. |
| `get-signature-document-use-case.test.ts` | package-bound recipient/snapshot/device; every in-request document accepted; foreign/stale document rejected; current eligibility; terminal/revoked session; private PDF metadata only. |
| `resend-email-provider.test.ts` | maps invitation and OTP requests to the approved sender/template and Resend SDK; returns the provider message ID; translates timeout, rate-limit and rejected-recipient failures to safe application errors; redacts API key, destination, OTP and invitation token from errors/logs; never retries inside the adapter. |
| `acknowledge-signature-document-use-case.test.ts` | literal true acknowledgement; one row per recipient/document/snapshot; duplicate no-op; foreign document; optimistic version; expired/revoked/device mismatch; client path; collaborator exact source-person mismatch, missing/disallowed role, inactive identity and stale/missing assignment; stale snapshot; session/audit metadata. |
| `start-formalization-signing-use-case.test.ts` | refuses zero/partial acknowledgements; accepts all current package documents; stale identity/assignment/snapshot/version and expired session; first entry calls exactly one atomic `create`, advances reading to signing and exposes no provider credential; lost-response retry with one matching active binding calls atomic `rotate`, changes only alias hash/expiry, invalidates the previous alias and does not call provider creation; signing-state retry; multiple/foreign/expired bindings; transaction conflict/invalid binding returns no proxy path. |
| `record-provider-submission-use-case.test.ts` | active unexpired exact session/request/recipient/binding validation; normalized `providerObservationId`; monotonic submitted; transaction input names exact session and versions; presenting authenticated session converts in place to result without token/device/CSRF hash or expiry changes; duplicate delivery is idempotent; every other active session/binding/invitation is revoked or consumed; transaction-owned partially-submitted/submitted request/Formalization derivation; no caller aggregate identity/version/status; no secret generator or replacement plaintext appears; conflict throws; lost-response context resolves the same cookie as result-only and document/provider use cases reject it; event publication only after commit; ambiguous response reconciliation. |
| `receive-signature-provider-webhook-use-case.test.ts` | valid neutral observation/reconciliation-only receipt; duplicate dedupe key; encrypted hint only; no raw provider event ID/name/payload fields and no processing policy in receiver. |
| `process-signature-provider-webhook-use-case.test.ts` | claims by generated receipt primary key, never dedupe key; generates a fresh `IdProvider` claim token per execution and never accepts worker identity in the request; claimed/already-processed/missing/busy/expired-or-foreign-claim branches; claim A cannot finalize after claim B reclaims the row even when both attempts represent the same logical worker; malformed/decryption failure fails only the exact owned claim and returns retry without a fabricated request ID event; strict provider-neutral `observation`/`reconciliation_only` discriminators reject unknown kinds, arbitrary status/assignment values, non-positive versions, negative counts and completed counts above required; reconciliation-only and any partial hint containing a terminal envelope, recipient or item value finalize through `completeWebhookReceiptClaim`, publish the trusted request ID, return `reconciliation_requested` and never call the graph-observation transaction; their already-processed replay publishes safely without a receipt write; recipient-completed observation does not submit before every required item completes; a non-terminal single-recipient observation enters `recordProviderObservationAndDerive` with `observationScope: 'partial_hint'`, one claim-token-checked `receiptUpdates` entry and a one-element recipient batch; scheduled reconciliation uses `authoritative_envelope`; the transaction derives `in_progress`, `partially_submitted`, `submitted`, `reconciliation_required` and terminal request/Formalization projections from its locked graph without caller-provided aggregate changes; a duplicate receipt does not suppress newer provider state; duplicate/reordered input; redacted failures. |
| `reconcile-signature-request-use-case.test.ts` | unchanged/submitted/terminal/completed shared-envelope mappings; one authoritative envelope-scoped provider read returns one normalized envelope state across at least two recipients and two items; scheduled reconciliation supplies `receiptUpdates: []`; one atomic observation-batch transaction with no per-recipient request/Formalization CAS loop; missing/foreign/duplicate snapshot members fail closed before the transaction; pending/in-progress envelope cannot confirm; per-item completed/rejected/cancelled/expired mapping; envelope-terminal fan-out preserves already completed item audit; per-item artifact fault injection; package protocol exactly once per recipient; unrelated pending recipient delays final artifacts; `confirmEnvelopeAndDerive` and `deriveTerminalOutcome` receive no caller aggregate/Formalization changes and transaction-derive them from locked rows; conflict/retry required. |
| `get-signature-result-use-case.test.ts` | submitted/confirmed/terminal responses; expiry/device mismatch; protocol only when confirmed; no PDF/provider/contact fields. |
| `close-signature-result-use-case.test.ts` | active close; repeated close; wrong device; state unchanged; receipt revoked. |
| `expire-signature-gateway-access-use-case.test.ts` | bounded batch; exact time boundary; idempotent expiry of all ephemeral records; reconciliation request for signing/provider uncertainty. |
| `signing-gateway-migration.test.ts` | forward migration from current `ready_for_sending` baseline; package-recipient assignments, request-level provider/attempt rows, item mappings, per-document acknowledgements, package sessions/bindings/protocols, nullable 32-byte partial-unique recipient `submission_observation_id` with mapper/type round trip, partial artifact uniqueness and every index/FK/check; absence of raw-token/link columns; rollback safety statement. |
| `acknowledge-signature-document.controller.test.ts` | real PostgreSQL active/expired/revoked/device-mismatched sessions; exact client path and collaborator source-person/permitted-role/current-assignment authority; duplicate acknowledgement and request-version race; no row on every denial. |
| `start-signing.controller.test.ts` | real PostgreSQL first-entry create race yields one active binding and one `reading -> signing` transition; committed-response-loss retry rotates the matching alias hash/expiry without a provider create; prior alias fails immediately; concurrent rotations have one winner and only its returned alias works; multiple/foreign/stale/terminal/conflict branches return no proxy path or credential. |
| `signing-gateway-proxy.controller.test.ts` | classified successful mutation supplies exact session/binding/alias proof and deterministic HMS observation ID; real PostgreSQL commit persists the recipient's exact 32-byte observation ID, converts that session in place to result with unchanged token/device/CSRF hashes and expiry, revokes every binding/other session/invitation and derives partial/submitted request/Formalization state; concurrent duplicate is accepted only when the durable observation ID plus same revoked binding/result-session proof match, and it preserves the same cookie authority; a different proof conflicts; forced recipient/request/Formalization conflict rolls back every mutation including observation ID and returns no success/set-cookie/secret; after simulated lost response the unchanged session cookie reads result but document/provider routes reject it. |
| Controller tests (seventeen exact controller basenames) | complete real-PostgreSQL flow coverage for send confirmation/cancel and exchange/OTP/submit/confirm races, plus route/status/DTO mapping for the matching REST row, authorization, Origin/CSRF/cookie policy, generic errors and no secret logs. Content adds ranges/no-store; webhook adds missing/wrong-length/wrong-value/oversize/duplicate/under-ten-second cases, calls `DocumensoWebhookNormalizer` before the Core receiver, passes only its neutral result, persists/schedules successfully normalized receipts and accepts an unprocessable foreign/ambiguous event generically without persisting or logging its raw body; proxy adds header/body rewrite and canary scans. |
| `process-signature-provider-webhook-job.test.ts` | real PostgreSQL claim uses the generated receipt primary key and one unique persisted claim token/30-second expiry; claim A cannot finalize after claim B reclaims the expired row, including with the same logical worker; attempts increment exactly once for each successful initial claim or expired reclaim and do not increment for a live-busy, non-due failed or already-processed row; one-receipt/one-safe non-terminal hint observation succeeds atomically and derives aggregate state from locked rows; reconciliation-only and terminal partial-hint paths mark only the receipt processed under its exact live token, publish the trusted request ID, return `reconciliation_requested` and leave recipient/document/request/Formalization rows unchanged; stale/expired claim completion rolls back; an already-processed receipt-only replay republishes safely without rewriting the receipt or graph; malformed/invalid encrypted hints fail only the owned receipt and publish nothing; a forced late request or Formalization conflict returns retry/conflict and rolls back the receipt, recipient, request-document, request and Formalization projection mutations; replaying an already-processed observation receipt leaves that row unchanged but can still apply newer safe provider state; the job declares `retries: 5`, maps `retry_required` to a retriable thrown error, and leaves an exhausted failed receipt auditable for request-level scheduled reconciliation. |
| `reconcile-signature-request-job.test.ts` | real PostgreSQL two-recipient/two-item authoritative observation with `receiptUpdates: []` succeeds in one transaction and increments every affected recipient/document/request/Formalization version once; a forced conflict on the later recipient or request document returns retry/conflict and rolls back every recipient, request-document, request and Formalization projection mutation while no receipt row changes. |
| Job tests (twelve exact job basenames) | real Inngest fixture registration; provisioning/delivery/cancellation event mapping; both Communication-result consumer mappings; provider idempotency, unique claim-token retry and partial recovery; encrypted invitations/OTP; webhook ordering; scheduled invitation, OTP, request and access reconciliation. The webhook and reconciliation jobs additionally own their exact real-PostgreSQL batch rollback cases above. |
| `documenso-signature-provider.test.ts` | pinned V2 multipart multi-file request/response DTOs, file-index identifiers for document-specific fields, disabled provider e-mail, technical aliases, complete item mapping, one envelope-scoped normalized authoritative envelope/recipient/item state response including completeness/duplicate/unknown-state fail-closed behavior, and per-item completed artifact bytes. |
| `documenso-webhook-normalizer.test.ts` | each pinned supported raw event/header/body maps to a strict neutral `observation` with resource-owned IDs and current optimistic versions; an unknown valid event for a known envelope maps to encrypted `reconciliation_only`; dedupe hashing is canonical; raw names/IDs/body never reach the Core receipt or logs; duplicate/missing/foreign/ambiguous envelope, recipient or item mappings fail closed without a provider network call; cipher purpose/context and closed value mapping are exact. |
| `documenso-signing-gateway-proxy.test.ts` | allow-listed paths/methods/content types, bidirectional rewrite, redirect/cookie/CSP handling, mutation classification and zero raw-token/origin canaries. |
| `signing-gateway-service.test.ts` | credentials, every context response refreshes the in-memory CSRF value, provider is rejected as a GET-context discriminator, schema parsing, `ArrayBuffer` PDF, cookie rotation/in-place result behavior and no Auth-client side effects. |
| Widget component/hook pairs in the literal tree | each component test covers rendered semantics, states and callbacks; each colocated hook test covers its local state/transitions, focus and cleanup. The document-reading and tab-list pairs cover ordering, active tab, independent acknowledgement, partial/all-read gating, keyboard tabs, content replacement and object-URL revocation. Page pair covers the exhaustive safe-step switch, fragment clearing, query cleanup and provider/result isolation. |
| `apps/web/tests/routes/formalization/signing-gateway.test.tsx` | isolated route rendering labeled mocked; valid/invalid fragment clearing; strict login return; desktop/narrow/keyboard flows; no provider token in URL/DOM/storage/console/network fixtures. |

## Acceptance coverage map

| Acceptance criteria | Primary automated files | Mandatory manual evidence |
| --- | --- | --- |
| CA-01–CA-03 | exchange/channel/request/verify Core tests; transaction/concurrency tests; matching controllers; page/OTP widgets | MV-01, MV-02 |
| CA-04–CA-06 | collaborator/document/acknowledgement Core tests; controllers; login and route tests | MV-03, MV-06 |
| CA-07–CA-09 | provider/proxy tests; submission/result Core tests; service/page/provider/result widgets | MV-02, MV-05, then G-01-gated shared exposure |
| CA-10–CA-13 | webhook/reconciliation/transaction/job tests; migration test | MV-01, MV-04, MV-07 after G-02 |
| CA-14 | all redaction assertions plus repository canary scan | MV-05, MV-08 |
| CA-15 | all widget pairs and route test | MV-06 |
| CA-16 | documentation link/content review | MV-08 |
| CA-17–CA-18 | send review/confirm Core tests; four internal controllers; PostgreSQL transaction race tests; existing configuration and new review widget pairs | MV-01, MV-02, MV-06 |
| CA-19–CA-20 | provisioning/delivery Core and job tests; SignatureProvider contract; Communication invitation job; secret scan | MV-02, MV-04, MV-07 |
| CA-21–CA-22 | cancellation Core/job/controller tests; configuration and cancel-dialog pairs; protected route integration | MV-02, MV-04, MV-06 |

# 5. Documentation alignment and revision history

## Applied Rule Pack

| Rule | Contract impact |
| --- | --- |
| `sdd.md` | Five-section Spec topology, revision discipline, gates and traceability. |
| `code-conventions-rules.md`, `core-package-rules.md` | One export per file, `Entity &` entities, `as const` statuses, Core-owned ports and use-case policy. |
| `validation-package-rules.md` | Canonical Zod schemas with validation through consuming packages and no local test suite. |
| `database-layer-rules.md` | Plural repositories, `add`/`replace` vocabulary, optimistic versions, Drizzle mapping and focused transactions. |
| `provision-layer-rules.md`, `server-app-layer-rules.md` | Existing source-reader extension, provider registration and module composition. |
| `rest-layer-rules.md`, `controllers-testing-rules.md` | Core service boundary, thin controllers, cookie/CSRF/error mapping and REST fixtures. |
| `messaging-layer-rules.md`, `jobs-testing-rules.md` | Versioned Event classes, direct publication, bounded reconciliation and job tests. |
| `ui-layer-rules.md`, `web-app-routing-rules.md`, `widget-testing-rules.md` | Thin leaf route, `ROUTES`, exhaustive widget/hook/test tree, feature query/action hooks and accessible validation. |
| `use-case-testing-rules.md` | Business decisions and edge cases remain in Core use cases and their focused tests. |

## Source-to-contract trace

| Source decision | Contract coverage |
| --- | --- |
| Direct 2026-09-03 multi-document package decision | Revision-6 amendment; RF-09, RF-11, RF-19, RF-31–RF-37; CA-05, CA-06, CA-12, CA-18, CA-19, CA-21; provider, persistence, REST, events, widget tree and MV-02. This supersedes the RFC/Jira one-envelope-per-document technical choice and requires follow-up authority alignment before conclusion. |
| Direct sibling/channel/projection decisions | Unified boundary; RF-03, RF-14, RF-30, RF-33, RF-34, RF-38; CA-02, CA-08, CA-18, CA-20; revision-5 persistence, UI and delivery contracts |
| SCRUM-144 client OTP/authentication/session | RF-01 through RF-05, RF-09, RF-10; CA-01 through CA-05 |
| SCRUM-144 collaborator HMS session/eligibility | RF-06 through RF-08; CA-04, CA-06 |
| SCRUM-144 private provider Gateway/no raw link | RF-11 through RF-14; CA-06 through CA-08; MV-05 |
| SCRUM-144 submitted versus confirmed/evidence | RF-15 through RF-23; CA-09 through CA-13 |
| SCRUM-144 fail-closed/accessibility | RF-26, RF-27; CA-15; manifest derived states |
| SCRUM-140 ready-state review and authorization | RF-29, RF-30; CA-17; internal send widget/REST contracts |
| SCRUM-140 request/envelope/recipient/invitation creation | RF-31–RF-35; CA-18–CA-20; Core/provider/transaction/persistence contracts |
| SCRUM-140 cancellation and projections | RF-36–RF-38; CA-21, CA-22; cancel-all job and internal widget contracts |
| Direct provider pin/private Postgres | Technical Contract deployment subsection and G-04 |
| Direct raw-token strictness | RF-12/RF-13, proxy contract, threat model and release-blocking MV-05 |
| Direct AGPL/X.509 gates | G-01/G-02, licensing/key sections and MV-07/MV-08 |
| Direct invite/OTP/session/result defaults | Approved decisions, RF-01/RF-04/RF-05/RF-10/RF-15/RF-23 and persistence algorithms |
| Pencil flow | Technical Contract Web experience subsection plus design/manifest.md |
| Architecture correction | RF-28, CA-16 and implementation tree |

## Provider references frozen for implementation

- [Documenso v2.17.0 release](https://github.com/documenso/documenso/releases/tag/v2.17.0)
- [Documenso API V2 developer guide](https://docs.documenso.com/docs/developers)
- [Recipient API/signing token](https://docs.documenso.com/docs/developers/api/recipients)
- [Envelope migration/API V2](https://docs.documenso.com/docs/developers/api/migrate-to-envelopes)
- [Webhook verification](https://docs.documenso.com/docs/developers/webhooks/verification)
- [Webhook events](https://docs.documenso.com/docs/developers/webhooks/events)
- [Self-hosting environment](https://docs.documenso.com/docs/self-hosting/configuration/environment)
- [Self-hosting e-mail](https://docs.documenso.com/docs/self-hosting/configuration/email)
- [Self-hosting/AGPL source statement](https://github.com/documenso/documenso/blob/main/apps/docs/content/docs/self-hosting/index.mdx)

Provider documentation can change after this revision. Implementation must verify the
pinned v2.17.0 source/contract rather than treating latest online documentation as
proof that the pinned image behaves identically. Any provider upgrade requires a Spec
revision, digest update, migration review and the full proxy/token/artifact contract
suite.

## Revision history

| Revision | Date | Status | Change |
| --- | --- | --- | --- |
| 1 | 2026-09-01 | draft | Initial SCRUM-144-focused contract from the PRD, RFC, repository/Pencil/provider research and approved recommendations; pins Documenso v2.17.0, defines strict token-safe proxy/security defaults and records AGPL and staging X.509 release evidence. |
| 2 | 2026-09-01 | draft | Makes all introduced Core entities, structures, repository/provider/transaction interfaces, Gateway response and widget prop types explicit; replaces the proposed Identity reader with the existing Formalization source-reader extension; replaces generic `save`/outbox language with low-level `add`/`replace` repositories and a bounded OTP delivery ledger; and fixes the complete leaf-route widget/hook/test tree. AGPL and staging X.509 gates remain open. |
| 3 | 2026-09-01 | open | Reclassifies AGPL review as the public-proxy/shared-release gate and staging X.509 as the real-provider acceptance/release gate, so neither blocks planning or isolated implementation. Replaces generic repository changes with exact low-level change structures, declares every use-case/service/event signature, expands the complete widget and test file trees, adds the exact affected-path ledger and CA validation ownership, and resolves the independent Spec Reviewer findings for transactions, persistence, REST composition, provider proxy, transport, typing and test ownership. |
| 4 | 2026-09-01 | open | Incorporates SCRUM-140 into this same Contract from the checked-in `ready_for_sending` baseline: adds authoritative review, idempotent request/document/recipient/envelope/invitation creation, recoverable Communication delivery, cancel-all and projections; binds each Gateway session to one recipient/document; keeps provider mappings outside the aggregate; defines envelope-once artifacts and recipient/document protocols; removes Core-to-Validation coupling; completes event consumers, exact paths, typings, widget tree and Pencil evidence; and resolves the independent Spec Reviewer rechecks. |
| 5 | 2026-09-01 | open | Suspends the sibling SDD as historical, makes this the sole active SCRUM-140/SCRUM-144 contract, fixes exactly one current channel (`email`) with Resend as the production delivery adapter, defers WhatsApp to a future material revision, standardizes the Formalization projection on `signatureStatus`, and resolves the independent Spec Reviewer findings for tuple cardinality, atomic lifecycle projections and Resend test ownership. |
| 6 | 2026-09-03 | in_progress | Repackages each HMS signature request as one Documenso v2.17 multi-document envelope; makes recipients, invitations, provisioning, cancellation, sessions, bindings and protocols request-scoped; adds immutable recipient-document assignments, envelope-item mappings and per-document acknowledgements; preserves one signed PDF per item; replaces the separate acknowledgement screen with HMS document tabs and all-read gating; defines authoritative envelope/item reconciliation and all-required-item submission; records that the accepted shared-envelope visibility and finalization coupling supersede the older RFC/Jira technical choice; resolves the independent Spec Reviewer findings; and enters Plan-backed implementation at F10. |
| 7 | 2026-09-03 | in_progress | Replaces the singular provider-observation transaction with one coherent envelope-scoped provider read and one batch transaction; decouples `0..n` receipt updates from recipient cardinality with mixed-duplicate semantics; adds explicit two-recipient/two-item, no-per-recipient-CAS and real-PostgreSQL late-conflict rollback validation split between receipt-bearing webhook processing and receipt-free scheduled reconciliation. |
| 8 | 2026-09-03 | in_progress | Makes webhook receipt processing executable through focused transaction operations that claim the generated receipt primary key under a fresh per-attempt claim token and expiry; prevents stale same-worker attempts from finalizing a newer reclaim; specifies exact attempt accounting and five-retry Inngest mapping; preserves already-processed mixed-state replay; forbids receipt IDs from being published as request IDs when no trusted payload is available; resolves the independent Spec Reviewer findings with no remaining ambiguity; and resumes Plan-backed F10 implementation. |
| 9 | 2026-09-03 | in_progress | Adds an exact-token receipt-only completion transaction and a strict provider-neutral encrypted webhook hint discriminator so unknown/reconciliation-only provider events can finalize their receipt, publish only a trusted request reconciliation and return `reconciliation_requested` without speculative graph observations or Documenso event-name coupling in Core; removes raw provider event metadata/payload from the Core receipt and persistence contract; declares the exact Server `DocumensoWebhookNormalizer` path and composition; assigns complete normalizer/controller/PostgreSQL-job evidence; resolves the independent Spec Reviewer findings without ambiguity; and resumes Plan-backed F10 implementation. |
| 10 | 2026-09-03 | in_progress | Reopens F10 after EV-220: adds atomic first-entry/active-binding alias rotation so provider-entry responses are recoverable without persisted plaintext; makes context GET rotate only refresh-safe CSRF and return a non-mutating signing recovery state; converts the presenting authenticated session in place to result-only so submission responses are recoverable without a second bearer secret; persists deterministic duplicate proof, revokes all other access and derives aggregate state inside one transaction; requires acknowledgement expiry and exact collaborator person/role/assignment checks; and forbids partial terminal webhook hints or callers from dictating request/Formalization projections. Mandatory same-reviewer audit passed at EV-223; Plan reconciliation resumed implementation at EV-224. |
| 11 | 2026-09-04 | in_progress | Makes collaborator access recoverable across HMS login, account switching, refresh and sequential signers in one browser: collaborator exchange rotates a single pre-authentication flow without consuming the invitation; exact assigned-account authentication atomically consumes it, revokes prior flow/authenticated sessions, creates the bound authenticated session and advances recipient/request state; a different current account receives an explicit account-switch state. Client exchange remains one-time. |
| 12 | 2026-09-07 | in_progress | Records the user's explicit accepted-risk decision to proceed to conclusion without fresh MV-01–MV-08, remaining visual, staging, security, legal, operations or external authority-alignment evidence; waives the feature reviewer and makes G-01/G-02/G-05/G-06 plus FND-047/FND-049/FND-050/FND-052 non-blocking without falsely marking them passed or technically resolved. Repository-wide structural validation and pull-request CI remain mandatory. |
| 13 | 2026-09-07 | in_progress | Expands the delivery scope, by explicit user direction, to every current tracked and untracked non-ignored repository change relative to `origin/develop`; regenerates the affected-path ledger from the gate's Git model while preserving other feature contracts as semantic authorities and making no new validation claim. |
