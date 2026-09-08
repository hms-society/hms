# Design manifest — configuração de assinaturas

## Source and verification

- Source file: `design/hms.pen`
- Inspected with Pencil schema-aware APIs on 2026-08-26.
- Every expected node was read structurally, rendered in Pencil, exported at
  scale 1 and visually inspected after saving locally. Previously gathered
  contextual/deferred artifacts remain recorded but are not acceptance targets.
- Pencil reported no clipping or overflow problem for the mapped roots.
- Export dimensions can exceed root canvas bounds when a dialog/card shadow is
  included. Those differences are deliberate and recorded below.

## Artifact inventory

| Node | Local artifact | PNG size | SHA-256 | Scope use |
| --- | --- | --- | --- | --- |
| `qOfh6` | [`qOfh6.png`](qOfh6.png) | 1200 × 1830 | `b3f8e58eb837f6861d657af5e05b0038b89e41d45b8ccb5125ac9cb09cbfa7a7` | Contextual page reference only; not an expected implementation frame. |
| `YWfhi` | [`YWfhi.png`](YWfhi.png) | 957 × 621 | `1afe0ddb0f56d82eaefeb233ed4ba4a92ba4f909b3b7f9c8f22cac90a1201ccf` | **Expected.** Isolated configuration card; 944 × 608 root plus effect bounds. |
| `sxENj` | [`sxENj.png`](sxENj.png) | 1200 × 914 | `1cacd8f82b8911c1cc65a1daf2e8a651419533023be454f21611bd94cea68deb` | **Expected.** Signatários tab, explicit document selection, progress and removal affordance. |
| `Vx43H` | [`Vx43H.png`](Vx43H.png) | 621 × 681 | `d7f82deae3b8273dcf6533425f11951387383e04a41ef82d4e8b33080a16058c` | **Expected.** Eligible-collaborator selector; 620 × 680 root plus stroke/effect. The hidden non-rendered `Tema jurídico` structure is not product authority. |
| `HcT8k` | [`HcT8k.png`](HcT8k.png) | 1200 × 1100 | `9f92fb8cc0de3a3599036ec49918b5b003c151a2c04d71164ff9fb36255856fb` | **Expected.** Posicionar campos tab, document readiness, PDF viewer, zoom/page controls and field overlay. |
| `GlZGA` | [`GlZGA.png`](GlZGA.png) | 553 × 411 | `02fbb31c26ea88ec1a4dfc6666a74bd71fb5da5b61d7bc22ff57d0c1675cab16` | **Expected.** Reusable 480px signatory-removal modal plus shadow; removes that collaborator's assignments and fields while preserving all others. |
| `nI1B0` | [`nI1B0.png`](nI1B0.png) | 833 × 761 | `0ad5ffa76b5423a2105677a6f0f595f6006623ceb9a5538887bcdf11e40ff0d3` | Deferred review/send reference only; not implemented by this Spec. |
| `MC4E2` | [`MC4E2.png`](MC4E2.png) | 1200 × 1374 | `2ee0ad0ef25cb4f6062f4ccc0386ddce3d419398dbd426340db819afe7f267e5` | Deferred reference only: post-send progress and cancel-all are outside this Spec. |
| `NSYug` | [`NSYug.png`](NSYug.png) | 553 × 366 | `8248ed835dbc5fabf8cbdd12aa915fe62f37e568cdae3cb015c17f657be71174` | Deferred reference only: cancel-all dialog is outside this Spec; 480 × 293 root plus shadow. |

## Normative state mapping

| State | Authority | Required interpretation |
| --- | --- | --- |
| Configuration summary | `YWfhi` | Render the embedded Formalization-page summary with status, metrics and a clear action to open the dedicated configuration page. Detailed document/signatory associations, message preview and pre-send actions belong to that page; sending remains outside this Spec. |
| Configuring signatories | `sxENj` | Client first, responsible lawyer default, additions below; document choices are explicit and show selected/total count. Sample identities/documents/counts are illustrative. |
| Selecting a collaborator | `Vx43H` | Search, eligible-profile filter, loading/empty/error/pagination and explicit selection. Only active eligible profiles appear. |
| Positioning fields | `HcT8k` | Document list on the side, selected preview, page/zoom controls and signature overlay. Auto-save copy must reflect actual saved/unsaved/error state. |
| Removing a signatory | `GlZGA` | Use the exact modal hierarchy and consequence copy: unlink all selected documents, remove that person's positioned fields, preserve every other signatory/document, then confirm through `Remover signatário`. |

## Implementation-facing screenshot analysis

| Reference | Route/surface/state | Viewport | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- | --- |
| [`YWfhi.png`](YWfhi.png) | `/formalizacoes/$formalizationId`; embedded signature-configuration summary; ready fixture | 944 × 608 root; 957 × 621 export with effects | Bordered configuration section; title/supporting copy; status and summary metrics; clear action to open the dedicated configuration page | Dedicated-page navigation through `Configuração do envio`; package-unconfirmed lock state; summary loading/error state; detailed tabs and mutations belong to the destination page | Sample people/documents/counts are data only. The detailed tabs, reset and send controls are intentionally not embedded in the Formalization page. | `CA-05`, `CA-07`, `MV-01`, `MV-04`; visual validation observation `evaluation.md#design-YWfhi` |
| [`Vx43H.png`](Vx43H.png) | Dedicated configuration page; eligible-collaborator selector open | 620 × 680 root; 621 × 681 export | Dialog title/copy; search input; eligible person rows with avatar/name/profile/contact; selection affordance; footer controls | Open/close, debounced server search, pagination, selection, loading/empty/error, focus trap/restore | Hidden non-rendered `Tema jurídico` node is excluded. Only active Lawyer, Paralegal or Supervisor results and their available e-mail appear; no CPF. | `CA-03`, `MV-01`; `evaluation.md#design-Vx43H` |
| [`sxENj.png`](sxENj.png) | Dedicated configuration page; `Signatários` tab; configuring fixture | 1200 × 914 | Step tabs/progress; client first; responsible lawyer; additional collaborator cards; channel selector; explicit document choices with selected/total count; add/remove controls | Add/remove collaborator, replace assignments, choose channel, loading/error/conflict recovery | Names, contacts, titles and counts are illustrative. No document is preselected. Default rows are non-removable. | `CA-03`, `CA-04`, `CA-07`, `MV-01`; `evaluation.md#design-sxENj` |
| [`HcT8k.png`](HcT8k.png) | Dedicated configuration page; `Posicionar campos` tab; selected ready preview | 1200 × 1100 | Step tabs/progress; document list and per-document status; signer/field controls; `CNjkl` preview card; toolbar filename, zoom minus/percentage/plus, page count; scroll canvas; white PDF page; colored signature overlay; auto-save status | Observe post-confirmation pending/processing/ready/failed states; retry failed preview; document/page/zoom; add/select/move/resize/delete only when ready; saved/unsaved/conflict/stale; pointer/touch/keyboard | PDF content and labels are illustrative. Opening this tab never initiates first-time generation. The frame does not authorize browser-to-converter access or a mouse-only editor. | `CA-05`, `CA-06`, `MV-01`, `MV-03`, `MV-04`; `evaluation.md#design-HcT8k` |
| [`GlZGA.png`](GlZGA.png) | Dedicated configuration page; remove-additional-signatory confirmation | 480 × 411 root; 553 × 411 export with shadow | `Remover signatário?` heading; explanatory copy; selected-person card; three consequence rows; `Cancelar` and destructive `Remover signatário` actions | Destructive confirmation, pending/error state, focus trap, close prevention while saving and trigger-focus restoration | Applies only to an additional collaborator. It removes that person's assignments/fields/channel and preserves all other configuration. | `CA-04`, `MV-01`; `evaluation.md#design-GlZGA` |

All five expected screenshots exist as valid non-empty PNGs and were visually inspected.
Pencil layout inspection reported no clipping or overflow on their mapped roots. The
desktop-only bundle leaves narrow, dark, `initialization_required`, batch
`preparing_configuration`, loading, error, stale, unsaved, forbidden and conflict states
uncovered. The user accepted these as
documented responsive/state-pattern
assumptions rather than requiring new Pencil frames before implementation; `MV-03` and
`MV-04` provide supplemental runtime captures.

## Reuse map

- Reuse the existing lawyer sidebar `u7g6V`, navbar `AmBqd`, Documentos card
  `HYvkL`, step tab `daRhp`, select `Y83nV1`, dialog base `iCoRX` and standard
  Button/Badge primitives where their production counterparts already exist.
- Use repository design tokens and semantic variables, including `$font-sans`,
  `$font-serif`, background/foreground/card/primary/muted/destructive and focus
  tokens. No pixel color, font, radius or shadow from the PNG is hardcoded.
- Pill controls shown in the references use the repository's pill convention.

## Intentional deviations

- The direct product clarification narrows delivery to pre-send configuration.
  `Iniciar envio de assinaturas` remains visually present in `YWfhi` but is
  disabled with explanatory accessible text; it opens no dialog and creates no
  request or link.
- Counts, names, e-mails, phones and document titles in the PNGs are illustrative.
  Production content is server-authoritative.
- Collaborators expose e-mail only with the current Identity model. A client may
  expose E-mail, WhatsApp or both. The dialog renders only available channels.
- `qOfh6`, `nI1B0`, `MC4E2` and `NSYug` are preserved only as contextual or future
  send/cancellation references and create no acceptance requirement here.

## Supplemental states

No supplied node covers narrow layout, dark mode, legacy `initialization_required`, PDF
failure, unsaved field, stale preview, empty search, forbidden access or optimistic conflict. These are
required behavior but do not need new Pencil screenshots before implementation:
they reuse existing HMS responsive and state-panel patterns and have explicit
acceptance criteria in the Spec. Additional design captures are recommended during
implementation if the 390px editor reflow or keyboard field affordance needs visual
iteration; absence of those captures does not authorize deviation from the
documented behavior.

## Responsive and accessibility contract

- At narrow widths, tab controls and document list precede the viewer; the viewer
  may scroll internally, while the page and dialog remain within the viewport.
- Pointer/touch placement always has visible keyboard controls. Fields expose
  document, page, signatory, type and selection state to assistive technology.
- Dialogs trap focus, choose sensible initial focus, restore trigger focus and
  prevent accidental close while saving.
- Focus remains visible at every zoom/theme; text and controls meet AA contrast;
  reduced-motion preference disables nonessential transitions.
- PDF content is not treated as the only accessible description: surrounding
  document/signatory lists and field controls expose equivalent configuration data.
