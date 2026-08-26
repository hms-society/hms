# Manifesto de design — Fundação da Formalização

Fonte canônica: `/home/petros/projects/hms/design/hms.pen`. Os PNGs abaixo foram
exportados em escala 1 e inspecionados visualmente. O Pencil não reportou problemas
de layout ou clipping nos Nodes mapeados.

| Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Página completa | `hms.pen#F2GBfU` | Formalização em andamento; formulário fechado; pacote ainda não confirmado | `1200 × 1828` | [F2GBfU.png](F2GBfU.png) | `/formalizacoes/$formalizationId`; `FormalizationPage` | `AppLayout`, sidebar, page header, cards, badges, buttons and documented semantic tokens | `CA-12`, `MV-01`, desktop screenshot comparison |
| Documentos | `hms.pen#Z3Ll2j` | Five selected documents with approved, rejected and not-generated rows; confirmation unavailable | design `944 × 400`; export `945 × 401` including border | [Z3Ll2j.png](Z3Ll2j.png) | source-neutral document-package widget composed by `FormalizationPage` | card, status badges, row actions, separators, secondary/destructive states | `CA-07`–`CA-09`, `MV-01` |
| Condições comerciais | `hms.pen#zetNe` | Example definition and example persisted answers | design `944 × 385`; export `957 × 398` including shadow | [zetNe.png](zetNe.png) | `CommercialConditionsCard` and shared dynamic-form fields | field, input, selection, switch, progress badge, currency/date presentation | `CA-04`–`CA-06`, `MV-01` |
| Fechar formulário | `hms.pen#b2f2jS` | Valid open form awaiting explicit close | design width `600`; export `673 × 392` including shadow | [b2f2jS.png](b2f2jS.png) | close-form confirmation dialog | base confirmation modal, primary/outline buttons, semantic highlight | `CA-06`, `MV-01` |
| Reabrir formulário | `hms.pen#nFKJE` | Closed form awaiting reopen and document lock | design width `600`; export `673 × 412` including shadow | [nFKJE.png](nFKJE.png) | reopen-form confirmation dialog | base confirmation modal, consequence panel, primary/outline buttons | `CA-06`, `CA-07`, `MV-01` |
| Confirmar pacote | `hms.pen#ZLBTF` | Four fresh terminal documents awaiting package confirmation | design width `600`; export `673 × 453` including shadow | [ZLBTF.png](ZLBTF.png) | document-package confirmation dialog | readiness summary, status copy, primary/outline buttons | `CA-10`, `MV-01` |
| Encerrar sem contratação | `hms.pen#USNIG` | Active Formalization awaiting terminal closure | design width `600`; export `673 × 505` including shadow | [USNIG.png](USNIG.png) | close-without-contract dialog | select, textarea, destructive warning and destructive/outline buttons | `CA-11`, `MV-01` |
| Trocar ficha | Shared dynamic-form selector; no dedicated Pencil node | Open active Formalization with matching temporary seed forms | responsive modal | — | `SelectFormDialog` opened from `CommercialConditionsCard` | search, legal context filters, explicit selection and replacement feedback | `CA-05A`, `EV-40` |

## Inventário de implementação e interação

| Reference | Route/surface/state | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- |
| `F2GBfU.png` | Formalization page for the assigned lawyer | Navigation shell; client/Intake heading; status; Consultation context and origin link; commercial conditions; Formalization documents; disabled signing configuration; destructive closure action; disabled contract confirmation | Open/reopen and close the form; enter document flow only when the form is closed; close without contract through confirmation dialog | Example client, identifiers, values and counts are fixtures. `Confirmar contratação` and signature configuration are visual placeholders only. | `CA-01`, `CA-03`, `CA-10`–`CA-12`, `MV-01` |
| `zetNe.png` | Commercial-conditions card | Schema-driven labels, required markers, values, toggles, completion indicator and grouped spacing | Save draft; server field errors; close; reopen; pending, success and failure feedback | The visible definition, values, “7 de 8” count and option labels are illustrative, not hardcoded product enums. The delivered renderer must follow the persisted definition snapshot. | `CA-04`–`CA-06`, `MV-01` |
| `Z3Ll2j.png` | Formalization document package | Title, summary, add-document action, five rows, version/status presentation, row actions and package-confirmation action | Selection; individual generation; cancel/retry; review/edit; approve/reject; choose current version; history; confirmation eligibility | Batch generation and download are intentionally absent. Confirmation follows terminal latest-version states, not the illustrative numeric summary. | `CA-07`–`CA-09`, `MV-01` |
| `b2f2jS.png` | Close-form confirmation | Serif question, validation/save consequence, document-flow release note, Cancel and Close form actions | Cancel returns focus; confirmation validates, saves and closes before enabling documents | Shown only after local shape validation; server field failures return to the form rather than closing the dialog successfully. | `CA-06`, `MV-01` |
| `nFKJE.png` | Reopen-form confirmation | Explicit document lock, unchanged-versus-changed reclose consequences, Cancel and Reopen actions | Confirmation opens the form and immediately blocks all document actions | It does not invalidate confirmation by itself; invalidation occurs only after a changed reclose. | `CA-06`, `CA-07`, `MV-01` |
| `ZLBTF.png` | Package-confirmation modal | Document count, approved/rejected terminal summary, current-revision criterion and no-signature note | Cancel or idempotent package confirmation | Counts are illustrative fixture data. No signature or message side effect is allowed. | `CA-10`, `MV-01` |
| `USNIG.png` | Close-without-contract modal | Required closure-reason select, optional notes, terminal-state warning, Cancel and destructive confirmation | Focus containment, required-field error, retry-safe close action | Example reason is fixture content; allowed reasons come from the existing Intake contract. | `CA-11`, `MV-01` |

## Responsive and state obligations

- At `390 × 844`, cards stack into one column, headers/actions wrap without
  horizontal overflow, row actions remain keyboard reachable, and the document
  table/list may change presentation without losing status or accessible names.
- Dark mode must use the repository tokens; no reference color may be copied as a
  hardcoded value.
- Loading, load failure/retry, forbidden, empty package, saving, server field error,
  open-form lock and stale-document states are required
  behavioral states but have no separate Pencil frame. They must use existing HMS
  primitives and copy patterns, preserving the hierarchy of the supplied frames.
- Supplemental screenshots for those remaining transient states are recommended during
  implementation, not required before implementation: repository components already
  establish their visual grammar, while `CA-11`, `CA-12` and `MV-01` require browser
  evidence at desktop and narrow viewports.

## Accepted design deviations

- Add explicit `Salvar rascunho`, `Fechar formulário` and `Reabrir formulário`
  controls to make persistence and the form lifecycle observable. The Pencil frame
  predates this product decision.
- `Encerrar sem contratação` is functional and opens the existing Intake closure
  reason/notes confirmation pattern.
- Reopening the form blocks Document Production. Closing unchanged preserves the
  package; closing changed invalidates its confirmation and requires new versions for
  every selected document while preserving version history.
- There is no batch-generation or download control. The disabled signing and contract
  confirmation cards remain non-functional in this delivery.
- The contract-form replacement selector is an approved functional extension beyond
  the supplied Formalization Pencil frames. It reuses the shared dynamic-form
  selector, appears only while the form is open, and clears answers after the server
  persists the new snapshot.
