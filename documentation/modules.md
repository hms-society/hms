# Modules Responsibilities

Each module owns a clear set of responsibilities. No module reaches into another's scope. They communicate through events and shared references.

---

## Engagement

Handles the entire journey from first contact to signed contract.

- Receives and registers new leads from any source (referral, union, walk-in, future digital channels).
- Records intake information and tracks it through a qualification pipeline.
- Conducts triage to decide next steps: schedule consultation, request more information, or close.
- Schedules and records legal consultations (virtual or in-person).
- Evaluates legal viability of the potential case.
- Formalizes the engagement when the client signs. At this point, the intake becomes a client and a case is opened in the Case module.
- Closes intakes that don't convert, with a recorded reason.

---

## Case Management

Owns the lifecycle of a legal case from opening to closure.

- Creates the case when a client is formally engaged.
- Manages the document checklist: tracks which documents are required, which have arrived, and which are still missing.
- Enforces the production gate: legal work cannot begin until the checklist is approved.
- Manages the case team: who is the lead lawyer, supporting lawyer, designated paralegal, intern, supervisor. Publishes team composition so other modules can verify authorization.
- Holds the checklist template catalog and rules for team composition by case type.
- Tracks case status across its full lifecycle.
- Handles the closure ritual when a case reaches its conclusion.

---

## Legal Production

Produces legal documents (petitions, motions, contracts, opinions).

- Creates legal pieces from scratch or from templates, with optional AI drafting support.
- Maintains immutable version history of every piece.
- Manages the review and approval workflow: a lawyer from the case team reviews, requests adjustments, or approves.
- Ensures only a lawyer assigned to the case can approve a piece.
- Records the final act of filing, distribution, or delivery.
- Detects document gaps during production and triggers case regression when the underlying dossier is invalidated.

---

## Legal Execution

Tracks the case after filing until closure.

- Manages deadlines, hearings, and tasks associated with the case.
- Distinguishes between procedural deadlines (with legal consequences) and operational ones.
- Records case progress and judicial movements.
- Monitors time-in-status to detect stalled cases.
- Records the case outcome (favorable ruling, settlement, delivery, withdrawal).
- Initiates the closure process, which may trigger financial settlement in Billing.

---

## Document Management

Receives, classifies, validates, and governs every document that enters the platform.

- Creates document batches automatically when files arrive from any channel (WhatsApp, portal, email, internal upload).
- Routes unidentified batches to a triage inbox for manual association.
- Processes documents through AI/OCR to suggest classification, assess quality, and detect duplicates.
- Requires human validation before any AI classification takes effect.
- Controls document access classification (internal, client-visible, restricted, confidential, partner-released) which governs visibility across portals.
- Handles document exceptions: waivers, provisional acceptance, deferred submission.

---

## Communication

Governs all recorded interactions with people and internal notifications.

- Registers every communication (inbound and outbound) in a central log tied to a person, intake, or case.
- Receives WhatsApp messages and translates them into internal events.
- Prepares and routes assisted messages for human approval before sending.
- Tracks communications that require action, with deadlines.
- Dispatches internal notifications to team members (new document arrived, deadline approaching, task assigned).
- Enforces consent rules: no message is sent without the person's active consent for that channel.

---

## Portal

Provides external access to clients and third parties (unions, external lawyers, partners).

- Serves a simplified, read-only view of case status, documents, and progress to clients.
- Serves a restricted, audited view to third parties based on explicit permissions.
- Does not decide what is visible — each originating module publishes what is released. Portal only serves what has been cleared.
- Records every external access attempt (successful or denied) for audit purposes.
- Manages third-party registration, user accounts, and permission grants with expiration.

---

## Identity

Knows who everyone is, how they access the system, and what they are authorized to do globally.

- Maintains a unique person registry with duplicate detection by tax ID.
- Links persons to system users via Supabase Auth.
- Assigns one of nine fixed profiles that determine system-wide authorization.
- Records LGPD consent grants and revocations as an immutable, append-only log.
- Does not manage case-level roles (that belongs to Case), external access (Portal), or commercial status (Engagement/Case).

---

## Finance

Handles the financial relationship with clients.

- Creates fee agreements when a client is engaged.
- Issues invoices and tracks payments.
- Manages collection processes for overdue invoices.
- Receives the case closure event to trigger final financial settlement.
- This module is currently greenfield: the data model exists, but business rules have not yet been specified with the client.

---

## Audit

Maintains a probative, immutable record of events with legal or regulatory weight.

- Receives and stores events that could serve as evidence in regulatory inquiries (bar association, data protection authority, judicial expert).
- Records consent changes, external access attempts, piece approvals, authorized exceptions, permission grants, and blocked AI actions.
- Guarantees append-only integrity with chained hashing.
- Exposes cross-context queries that no single module can answer alone: all actions on a person's data, all approvals by a lawyer, all exceptions in a period.
- Does not store operational history (each module keeps its own). Only stores the subset with probative value.
- Does not make decisions or block operations. It observes and records.

---

## What is not a module

**Analytics** is not a module. It is a read model layer that subscribes to events from all modules and maintains pre-calculated projections for the 12 MVP indicators. It has no domain logic, no rules, and no vocabulary of its own. It may have its own database for performance, but that is an infrastructure choice, not a domain boundary.

**Infrastructure** is not a module. Event bus, read model storage, AI/OCR integration, immutable log storage, SLA timers, and dual-approval utilities are shared technical mechanisms. They live below the modules, not alongside them.

**AI Governance** is not a module. Each module that uses AI owns its own suggestions, validation rules, confidence thresholds, and blocking policies. The rule "a human validates before AI takes effect" is an invariant inside each module, not a central policy.

**Platform/Configuration** is not a module. Every catalog (checklist templates, piece templates, role catalogs, consent types, SLA rules, system parameters) lives inside the module that consumes it. Configuration follows its instance.