# Checklist document flow design handoff

The supplied screenshots were visually inspected on 2026-10-12. Pencil `aIyUS` was inspected through MCP and matches the compact white list, teal pill actions and grouped requirements. The currently exposed Pencil adapter supports `get_app_state`/`execute` rather than the documented older editor-state API; explicit-node reads and screenshot succeed, whole-document visitors/token reads currently fail with `TypeError`. No encrypted file was read through filesystem tools. No design mutations are part of this delivery.

| Reference | Source / node | Surface / state | Viewport | Screenshot | Inventory / approved adaptation | Checks |
| --- | --- | --- | --- | --- | --- | --- |
| Pending actions | User supplied screenshot; Pencil aIyUS | Unreceived optional item | 434×87 crop, desktop row | [pending-actions.png](pending-actions.png) | Right-aligned required/optional text and Enviar documento / Selecionar documento existente thin teal pill buttons; mobile stacks/wraps actions within row | CA-08, MAN-01, MAN-02, VIS-01 |
| Fulfilled requirements | User supplied Pencil screenshot; aIyUS | Atendidos by document or waiver | 1162×520 crop | [fulfilled-reference.png](fulfilled-reference.png) | Light teal group header; compact white two-line rows with separators; required/optional top right; Abrir documento bottom right; existing waiver rows preserved without redesign | CA-05, CA-08, MAN-03, VIS-01 |
| Attachment dialog | User authorizes complete flows; HMS shared Dialog | Upload, file chosen, pending/error, source selection/loading/empty/error | Desktop application and 390×844 | Existing references above govern actions; dialog is an adaptation | Dialog title/description, inherited client/Case/item context, explicit selection and confirm/cancel. Use existing primitives rather than invent a missing artboard. Long source names wrap; mobile scrolls dialog content and stacks footer actions | CA-01, CA-03, CA-07, CA-08, MAN-01, MAN-02, VIS-01 |
| Adequacy dialog | Case REQ-008 human review and same shared Dialog | Exact source open/download and explicit adequacy | Desktop and 390×844 | Adapted shared dialog | Identify attached filename and exact source/version, explain receipt needs review, open/download authenticated bytes and explicitly confirm adequacy. DOCX is described as download; do not render raw source HTML | CA-05, MAN-03, VIS-01 |

The user requested complete flows after supplying only the row actions. Existing shared dialog composition is the bounded visual adaptation; it does not introduce permissions or automatic validation. Earlier removed dossier, exception, activity and gate sections and receipt chip remain removed. Preserve Case header/tabs, search and progress outside the touched list/actions.

| Widget / state | Existing component | Token / exact props and classes |
| --- | --- | --- |
| Row actions | `ui/shadcn/button.tsx` Button | `variant='brand' size='xs' className='rounded-full'`; semantic primary stroke/text, background surface; hover uses primary foreground; existing disabled opacity and focus-visible ring |
| Confirm/cancel | Button | Confirm `variant='default'`, cancel `variant='outline'`, `rounded-full`; pending disabled plus readable status; no unlabeled icon-only action |
| Dialog shell | `ui/shadcn/dialog.tsx` | Controlled Dialog, DialogContent/Header/Title/Description/Footer; bg-popover/text-popover-foreground, muted description, border/ring-foreground, rounded-xl; inherited Radix focus trap/restoration |
| Target context | semantic content/definition list | `text-foreground`, `text-muted-foreground`, `bg-muted/50`, `border-border`, `rounded-lg`, `p-3`, `gap-2`; client/item visible without extra editable identifiers |
| Upload | shared Input type=file | `accept='.pdf,.jpg,.jpeg,.png'`, label and format/size explanation; filename remains visible on retry; text-destructive alert on failure |
| Source selector | shared Input + native labeled radios | Search name, source type/version text; semantic primary selection/focus, muted secondary metadata, border-border separators; no custom inaccessible clickable div |
| Rows/header | existing checklist list | bg-card/text-card-foreground, border-border, rounded-xl; group `bg-highlight text-highlight-foreground`, readable sentence case Atendidos; row `px-4 py-3`, `gap-2`, no extra validated chip/arrow |
| Narrow viewport | existing responsive utilities | min-w-0, w-full, break-words, flex-col/sm:flex-row and wrapping footer; dialog max-height with overflow-y-auto preserves controls; document body no horizontal overflow |
| Errors and progress | semantic status | role=alert with text-destructive for actionable failure; role=status for pending; visible disabled button text; no sensitive storage credentials in displayed errors/logs |

Actual primitives were inspected: brand and xs are implemented Button variants; Dialog content defaults to sm:max-w-3xl with p-4/gap-4. Composition may constrain it with standard max-width utilities. Use semantic utilities rather than copying crop pixel colors or adding global theme changes. Current global Dialog increases nested text-xs to text-sm; retain readability and document observed comparison instead of silently refactoring global typography.

Saved PNGs were validated for PNG signature, nonempty bytes and IHDR dimensions and inspected through `view_image`. Runtime screenshots/traces are ignored artifacts referenced by Evaluation, not these normative references.

## Upload dialog refinement — 2026-10-13

User selected Pencil `qUmGc` as the upload-dialog reference. Inspected complete resolved node and screenshot through Pencil MCP; saved [upload-dialog-reference.png](upload-dialog-reference.png). Use640px desktop width, Fraunces heading and compact description, header/body/footer dividers, pale secondary context emphasizing requirement then required/optional and client/Case, selected-file row with file icon and outline choose/change action, explicit client/item relation confirmation and pending-human-review explanation. Footer stays white with teal outline cancel and solid primary Enviar documento. Preserve PDF/JPEG/PNG10MiB policy, controlled confirmation/recovery/focus and scrollable mobile body; source-selection behavior unchanged. This visual refinement adds no actors, permissions or validation outcomes. Earlier Admin extension remains withdrawn. MapsCA08/MAN01/VIS01.

## Overview presentation alignment — seUFV

User reference `seUFV` inspected through Pencil MCP on2026-10-13, including `SYtrH` columns screenshot and node typography/layout tokens. Visual-only implementation places priorities first, compact checklist summary second, white card bodies with secondary header bands, and team/origin right column that stacks on narrow screens. Detail requirement rows, receipt chip, next-action banner and timeline are removed from the overview presentation only. Existing checklist/team/task tabs provide actions; no closure workflow or permission is added. Source task/origin static data remains existing implementation debt and is not replaced with design fixture content. Current display summary counts all fulfilled requirements (document or waiver), while progress retains the existing mandatory denominator.

Manual/Visual artifacts are ignored `apps/web/.playwright-cli/screenshots/overview-seufv-{desktop,mobile}.png`; screenshots inspected against the reference. The Pencil reference export was produced by the Windows design host at `/C:/Ubuntu-22.04/home/petros/projects/hms/apps/web/.playwright-cli/screenshots/overview-reference/SYtrH.png`, which is not claimed as a Linux-local saved artifact.

## Waiver grant dialog — rvEA9

Pencil reference rvEA9 inspected2026-10-13:560px modal, separated header/body/footer, shaded requirement context, required justification with placeholder/help, consequences and audit/revocation copy, pillfooter actions. Production adaptation preserves existing case/client context and grant/view/revoke controls; empty/whitespace grant confirmation disabled at UI boundary while existing Core/API validation remains unchanged. SharedDialog is composed through props/classes, no global primitive changes. Desktop/mobile screenshots ignored .playwright-cli/screenshots/waiver-rvea9-{desktop,mobile}.png inspected.

## Dedicated review page — 2026-10-13

User replaced the adequacy modal presentation with a standalone page on the existing checklist item route. The page uses the shared Lawyer AppLayout, title/context, dominant70dvh PDF/image preview or safe download, explicit adequacy acknowledgement, validation/recovery and replacement dialogs. Back returns toCase?tab=checklist. Keep existing readonlydocument page separate and legacy nonreferenceditem details intact. Desktop1440x1080 and390x844 realservice captures are ignored .playwright-cli/screenshots/review-page-{desktop,mobile}.png; parent inspectedlargepreview, appnooverflow, andnativePDFcontent internalpan/zoom. Changesdo notmodifypermissions/Case lifecycle/sourcecontracts. Closed/unknown/failedcontext remainsreadonly; priorAdminuploadextension stayswithdrawn. MapsCA05/08/AUTO08/MAN03/VIS01.

Waived fulfilled rows (2026-10-13 user correction) hide Enviar documento and Selecionar documento existente, retaining waiver reasoning/actions. Revocation returns the requirement to Pending and restores normal attachment actions; this changes row presentation, not server/source/CAS contracts.

### Added-item required choice — revision7

Source: user-provided `add-item-required-choice-reference.png` (existing Add item dialog). Preserve white37rem dialog, serif heading, labelled name field, compact spacing, information surface and teal pill actions. Add shared labelled Checkbox `Item obrigatório`, checked initially, below the name/helper and above the consequence notice. Unchecked means optional. Dynamic notice describes the actual chosen flag. Keep focus/keyboard/pending/error behavior and390px reflow. Maps RF12/CA14/AUTO16/MAN09/VIS01. Implementation captures stay in ignored browser output, not this reference directory.
