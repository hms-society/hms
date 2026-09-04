---
title: Signing Gateway design-reference manifest
source_file: design/hms.pen
source_format: pencil
exported_at: 2026-09-01
---

# Formalization sending and Signing Gateway design references

This manifest is the durable bridge between the encrypted Pencil source and the
implementation contract in ../spec.md. The source file must be inspected or
changed only through Pencil tooling. PNG exports are review evidence; they are
not implementation assets and must not be bundled into the Web application.
All listed nodes were inspected through Pencil on 2026-09-01, exported at source
resolution and reported no structural problems.

## Internal configuration and sending flow (SCRUM-140)

| Order | Pencil/export | Route, viewport and state | Implementation surface | Contract/evidence |
| --- | --- | --- | --- | --- |
| 1 | qOfh6 / [qOfh6.png](qOfh6.png) | `/formalizacoes/$formalizationId`; 1200×1830 source plus 390×844; package confirmed/configuring | `FormalizationSendingConfiguration` | Preserve configuration composition; CA-17/CA-22; MV-06 transient comparison screenshot. |
| 2 | YWfhi / [YWfhi.png](YWfhi.png) | Same route; 1200 desktop plus 390×844; `ready_for_sending`, no request | `FormalizationSendingConfiguration` action card | `Configurar envio` only when ready; `Cancelar configuração` remains distinct; CA-17/CA-22. |
| 3 | sxENj / [sxENj.png](sxENj.png) | Same route; 1200×914 plus 390×844; add-signatory open | Existing `SignatoriesTab`/`CandidateDialog` | Regression only: no automatic document assignment; CA-17. |
| 4 | Vx43H / [Vx43H.png](Vx43H.png) | Same route; 620×680 dialog plus reflow at 390×844; candidate search/filter/results | Existing `CandidateDialog` | Regression only: accessible eligible-collaborator selection; CA-17. |
| 5 | HcT8k / [HcT8k.png](HcT8k.png) | Same route; 1200×1100 plus 390×844; positioning fields | Existing `SignatureFieldsTab` | Regression only: coordinates frozen into request; CA-17/CA-19. |
| 6 | nI1B0 / [nI1B0.png](nI1B0.png) | Same route; 760-wide dialog plus 390×844; review loading/ready/blocking/error/confirming | `ReviewAndConfirmSendingDialog` | Authoritative summary, no CPF/provider data, action `Confirmar e enviar`; CA-17–CA-20; MV-02/MV-06 transient comparison screenshot. |
| 7 | MC4E2 / [MC4E2.png](MC4E2.png) | Same route; 1200×1374 plus 390×844; provisioning/delivery/partial failure/sent | `FormalizationSendingConfiguration` status branch | Locked editing, safe progress, retry and conditional cancel-all; CA-18–CA-22; MV-02/MV-04/MV-06. |
| 8 | NSYug / [NSYug.png](NSYug.png) | Same route; 480-wide dialog plus 390×844; cancel idle/pending/error/partial retry | `CancelAllSignatureSendingDialog` | Immediate access revocation, history preservation, explicit destructive action; CA-21/CA-22; MV-04/MV-06 transient comparison screenshot. |

## Canonical flow

| Order | Pencil node | Export | Contract obligation |
| --- | --- | --- | --- |
| 1 | vnDP5 | [01-access-invitation.png](01-access-invitation.png) | Public entry reveals no document or recipient data, explains seven-day invitation validity and moves into identity confirmation. |
| 2 | yGoz0 | [02-select-channel.png](02-select-channel.png) | Revision-5 structure reference only: the client confirms zero or one currently consented masked e-mail. The pictured WhatsApp option and multi-channel choice are explicitly superseded; WhatsApp is deferred to a future revision. |
| 3 | epRP0 | [03-verify-otp.png](03-verify-otp.png) | Six separate visual positions behave as one accessible six-digit input; the view communicates 30-minute validity and resend cooldown. |
| 4 | UGhOX | [04-read-document.png](04-read-document.png) | An authenticated one-day session exposes the complete PDF with document/page controls, zoom, keyboard access and an explicit transition to signing. |
| 5 | b3KJwr | [05-confirm-signature.png](05-confirm-signature.png) | The Gateway shows revalidated identity, requires an explicit acknowledgement and keeps the final action disabled until consent is checked. |
| 6 | Ns3TQ | [06-signature-submitted.png](06-signature-submitted.png) | A provider submission is distinguished from authoritative confirmation; signing access is invalidated while HMS reconciles the outcome. |
| 7 | o9uBLt | [07-signature-confirmed.png](07-signature-confirmed.png) | Confirmation exposes the HMS protocol and preservation statement without reopening the PDF or provider session. |

## Actor and fail-closed variants

| Pencil node | Export | Contract obligation |
| --- | --- | --- |
| Cl6te | [09-collaborator-read.png](09-collaborator-read.png) | An eligible assigned collaborator reaches document reading through the existing HMS session and never enters the OTP channel flow. |
| Y64KMM | [10-collaborator-confirm.png](10-collaborator-confirm.png) | Collaborator confirmation identifies the authenticated collaborator and uses the same explicit acknowledgement and Gateway boundary. |
| Ty3Vs | [11-access-unavailable.png](11-access-unavailable.png) | Invalid, expired, cancelled, rejected and otherwise terminal access fails closed with non-enumerating copy and no document metadata. |
| HkWES | [12-no-authorized-channel.png](12-no-authorized-channel.png) | A client with no currently consented channel cannot continue; the view does not disclose raw destinations. |
| wagTq | [13-otp-invalid-expired.png](13-otp-invalid-expired.png) | Invalid, superseded, already-used and expired codes use a generic error while preserving the resend path when not locked. |
| mBKko | [14-otp-attempt-limit.png](14-otp-attempt-limit.png) | Five failed validations create a visible 15-minute lock and disable confirmation and resend as applicable. |

## Inventory-only reference

| Pencil node | Export | Classification |
| --- | --- | --- |
| FbWzH | [08-internal-tracking-out-of-scope.png](08-internal-tracking-out-of-scope.png) | Inventory only. Internal post-send tracking belongs to SCRUM-128 and must not be implemented by SCRUM-144. |

## Required derived states

The Pencil file has one canonical unavailable-state language. The implementation
must derive the following variants from node Ty3Vs without changing layout,
hierarchy, token use or disclosure policy:

- private PDF temporarily unavailable, with safe retry;
- private signing provider temporarily unavailable, with safe retry before submission;
- recipient rejected the document;
- request or recipient was cancelled;
- invitation, authentication session or result receipt expired;
- collaborator became inactive, ineligible or no longer assigned;
- authoritative confirmation needs reconciliation.

State-specific copy and available actions may change, but every variant must remain
generic enough to prevent recipient, document and request enumeration.

## Visual validation obligations

- Preserve the repository design tokens, serif/sans hierarchy, focus treatment,
  light/dark behavior and contrast rules from documentation/design.md.
- Validate internal SCRUM-140 references at their source desktop dimensions and at a
  narrow 390×844 viewport; validate external Gateway composition at 1200×900 and
  390×844. The legacy complete post-send tracking reference remains excluded.
- Validate keyboard-only operation, visible focus, zoom at 200%, reduced motion,
  screen-reader labels and live announcements for OTP, loading, lock and
  reconciliation state.
- Re-inspect the Pencil nodes through Pencil tooling if a visual decision changes;
  do not infer hidden properties from the PNG exports.
- Keep route/widget tests semantically focused. Pixel-level review is evidence for
  visual fidelity, not a substitute for accessibility or behavior assertions.
