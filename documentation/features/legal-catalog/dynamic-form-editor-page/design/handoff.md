# Dynamic form editor design handoff

The authoritative source is `design/hms.pen`. Exports use Pencil scale `1`; dialog PNGs include shadow bounds beyond the logical frame dimensions. All listed nodes were opened and visually inspected on 2026-09-15.

This artifact follows the repository-wide SDD `design/handoff.md` convention. It supersedes the earlier feature-local `manifest.md` filename while preserving the required reference inventory, node, state, viewport, implementation surface and AC/MV mappings below and adding the offline implementation contract.

| Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Editor page | `design/hms.pen` / `iX5sr` | Existing Consultation form, saved | 1440×1200 | [iX5sr.png](./iX5sr.png) | `/formularios-dinamicos/$dynamicFormId`; `DynamicFormEditorPage` | HMS application shell, serif page heading, neutral cards, status switch, tabs, badges, outlined/destructive actions | Compare identification, availability, stage/area/topics, description, ordered field rows, type badges, edit actions and preview tab in MV-01/MV-02. |
| Save bar — saved | `design/hms.pen` / `avpzp` | Saved | 1184×70 logical; PNG 1184×71 | [avpzp.png](./avpzp.png) | `DynamicFormSaveBar` | Success status, primary `Salvar modelo`, destructive `Excluir formulário` | Compare saved copy/actions and enabled-state matrix in AC-09. |
| Save bar — dirty | `design/hms.pen` / `TN5wx` | Unsaved changes | 1184×70 logical; PNG 1184×71 | [TN5wx.png](./TN5wx.png) | `DynamicFormSaveBar` | Warning status and primary/destructive actions | Compare dirty announcement, save availability and disabled availability switch in AC-09/AC-13. |
| Save bar — saving | `design/hms.pen` / `Ew8qq` | Save pending | 1184×70 logical; PNG 1184×71 | [Ew8qq.png](./Ew8qq.png) | `DynamicFormSaveBar` | Pending status and disabled progress button | Compare pending copy, progress semantics and blocked duplicate submission in AC-09. |
| Save bar — failure | `design/hms.pen` / `AYJ95` | Recoverable save failure | 1184×70 logical; PNG 1184×71 | [AYJ95.png](./AYJ95.png) | `DynamicFormSaveBar` | Destructive error status, retry and delete actions | Compare retained local payload, `Tentar novamente` and retry operation identity in AC-09/AC-10. |
| Add field — short text | `design/hms.pen` / `Z5OyY` | Short text selected | 560×550 logical; PNG 633×623 | [Z5OyY.png](./Z5OyY.png) | `DynamicFormFieldDialog` → `DynamicFormTextFieldConfiguration` | Dialog, type chips, text inputs, checkbox, primary/outline buttons | Compare title/context copy, type selection, label/help/placeholder/required controls and focus lifecycle in AC-05/AC-14. |
| Add field — long text | `design/hms.pen` / `Sys4w` | Long text selected | 560×589 logical; PNG 633×662 | [Sys4w.png](./Sys4w.png) | `DynamicFormFieldDialog` → `DynamicFormTextFieldConfiguration` | Dialog, selected type chip, textarea | Compare multiline control and type-specific explanation in AC-05. |
| Add field — date | `design/hms.pen` / `qpDOo` | Date selected | 560×550 logical; PNG 633×623 | [qpDOo.png](./qpDOo.png) | `DynamicFormFieldDialog` → `DynamicFormDateFieldConfiguration` | Dialog, date type chip, text controls | Compare the date explanation and optional fixed-date default extension in AC-05/AC-06. Any placeholder-like Pencil content is visual evidence only and must not become an authorable Date property. |
| Add field — boolean | `design/hms.pen` / `WiFpJ` | Sim/Não selected | 560×575 logical; PNG 633×648 | [WiFpJ.png](./WiFpJ.png) | `DynamicFormFieldDialog` → `DynamicFormBooleanFieldConfiguration` | Dialog, selected type chip, default switch, support text | Compare optional boolean default, required control and helper copy in AC-05/AC-06. |
| Add field — multiple selection | `design/hms.pen` / `i194Af` | Multiple selection selected | 560×714 logical; PNG 633×787 | [i194Af.png](./i194Af.png) | `DynamicFormFieldDialog` → `DynamicFormSelectionFieldConfiguration` → `DynamicFormOptionsEditor` | Ordered option rows, drag handles, delete icons, add-option button | Compare option add/remove/reorder, stable identity, minimum count and multi-default extension in AC-05/AC-06/AC-07. |
| Add field — single selection | `design/hms.pen` / `lmvBH` | Single selection selected | 560×772 logical; PNG 633×845 | [lmvBH.png](./lmvBH.png) | `DynamicFormFieldDialog` → `DynamicFormSelectionFieldConfiguration` → `DynamicFormOptionsEditor` | Ordered option rows, selected type chip, placeholder | Compare single-option/default selection and Formalization context copy in AC-05/AC-06. |
| Add field — integer | `design/hms.pen` / `TFlkr` | Integer selected | 560×618 logical; PNG 633×691 | [TFlkr.png](./TFlkr.png) | `DynamicFormFieldDialog` → `DynamicFormNumericFieldConfiguration` | Numeric minimum and placeholder controls | Compare integer-only validation and optional minimum/default in AC-05/AC-06. |
| Add field — BRL currency | `design/hms.pen` / `Mv1W8` | Currency selected | 560×618 logical; PNG 633×691 | [Mv1W8.png](./Mv1W8.png) | `DynamicFormFieldDialog` → `DynamicFormNumericFieldConfiguration` | BRL selector, formatted amount inputs | Compare fixed BRL metadata, localized formatting and optional numeric default in AC-05/AC-06. |
| Add field — percentage | `design/hms.pen` / `hgwKf` | Percentage selected | 560×618 logical; PNG 633×691 | [hgwKf.png](./hgwKf.png) | `DynamicFormFieldDialog` → `DynamicFormNumericFieldConfiguration` | Decimal-places control and percentage inputs | Compare 0–100 range, decimal precision and optional default in AC-05/AC-06. |
| Remove field | `design/hms.pen` / `Lcpwf` | Used field removal confirmation | 440×content logical; PNG 513×365 | [Lcpwf.png](./Lcpwf.png) | `DynamicFormFieldRemovalDialog` | Destructive dialog, impact callout, cancel/remove actions | Compare selected field name, form stage, usage totals, historical-preservation copy, pending/error/focus states in AC-12. |

## Offline implementation authority

This file is the implementation handoff for agents that cannot open Pencil. Apply sources in this order:

1. `documentation/design.md` and `apps/web/src/ui/shared/styles/global.css` own HMS semantic tokens, light/dark behavior and typography.
2. Existing components under `apps/web/src/ui/shadcn` own interaction, focus, disabled and motion behavior.
3. This handoff owns the component selection, variants, layout recipe and Pencil-to-HMS mapping for this feature.
4. The saved PNGs own visual comparison, content hierarchy and relative composition.
5. Raw Pencil hex values and measurements are evidence, not permission to add arbitrary Tailwind values or inline styles.

If an exact Pencil value has no HMS token, use the semantic fallback declared below. Do not add a global token, modify `global.css`, hardcode a color or reconstruct the Pencil component. Record any remaining mismatch in `evaluation.md`.

## Extracted token crosswalk

The following bindings were read directly from the 15 referenced Pencil nodes on 2026-09-15. Implementation uses the semantic HMS column; the resolved Pencil value is included only for audit and screenshot comparison.

| Pencil binding | Resolved Pencil value | HMS CSS token | Tailwind usage | Required role |
| --- | --- | --- | --- | --- |
| `$background` / page raw fill | `#F5F2EC` | `--background` | `bg-background` | Main content canvas. Never reproduce the raw page fill. |
| `$foreground` | `#1C2C2A` | `--foreground` | `text-foreground` | Primary body and field-row text. |
| `$card` | `#FFFFFF` | `--card` | `bg-card text-card-foreground` | Identification card, field rows and save bar. |
| `$brand` | `#2D5F59` | `--brand` | `text-brand` | Page and dialog headings. |
| `$primary` | `#3D8277` | `--primary` | Component default or `bg-primary` | Primary actions, selected controls and progress. |
| `$primary-foreground` | `#FFFFFF` | `--primary-foreground` | `text-primary-foreground` | Content on primary actions. |
| `$secondary` | `#EFF5F4` | `--secondary` | `bg-secondary` | Close control and quiet supporting surfaces. |
| `$secondary-foreground` | `#1A302E` | `--secondary-foreground` | `text-secondary-foreground` | Content on secondary surfaces. |
| `$muted` | `#F2F2F2` | `--muted` | `bg-muted` | Pending/disabled and quiet state surfaces. |
| `$muted-foreground` | `#636058` | `--muted-foreground` | `text-muted-foreground` | Descriptions, placeholders, helper copy and inactive icons. |
| `$accent` | `#F4EEE0` | `--accent` | `bg-accent text-accent-foreground` | Removal-impact emphasis only. |
| `$destructive` | `#B91C1C` | `--destructive` | `text-destructive` or `Button` destructive variant | Error copy/icons and destructive intent. |
| `$destructive-muted` | `#C45454` | Use the existing `Button` destructive variant | `variant='destructive'` | Destructive buttons; do not recreate the Pencil fill. |
| `$destructive-foreground` | `#FFFFFF` | Not used by the current shared destructive button | No feature utility | Pencil evidence only; HMS intentionally replaces the solid treatment with its theme-aware translucent destructive variant and destructive-colored text. |
| `$border` | `#DCD7CB` | `--border` | `border-border` | Cards, dialog divisions and save-bar top border. |
| `$input` | `#B8B09F` | `--input` | Owned by `Input`, `Textarea`, `Select` | Form-control borders and unchecked switch state. |
| `$ring` | `#3D8277` | `--ring` | Existing `focus-visible` utilities | Keyboard focus; never implement a separate outline color. |
| `$highlight` | `#E0F0EE` | `--highlight` | `bg-highlight` | Teal field-type or informational surface. |
| `$highlight-foreground` | `#2B6C65` | `--highlight-foreground` | `text-highlight-foreground` | Content on highlight surfaces. |
| `$sidebar-bg` | `#134C50` | Existing application shell/sidebar tokens | Reuse shell, `Nav Bar` and `Sidebar Admin`; no feature class | The editor must not rebuild or restyle the shell. |
| `$font-sans` | `Plus Jakarta Sans` | `--font-sans` | `font-sans` | Body, labels, controls, status and helper copy. |
| `$font-serif` | `Fraunces` | `--font-serif` | `font-serif` | Page and dialog headings only. |

All semantic classes inherit the repository's dark-mode values. The light-only Pencil file must not be used to derive independent dark colors.

## Typography recipe

| Role | Pencil evidence | Required implementation |
| --- | --- | --- |
| Page title | Fraunces, 24, weight 600, `$brand` | `font-serif text-2xl font-semibold text-brand`; semantic `h1`. |
| Dialog title | Fraunces, 20, weight 600, `$brand` | `DialogTitle` plus `font-serif text-xl font-semibold text-brand`. |
| Body/input text | Plus Jakarta Sans, mainly 12–13, normal | Use component defaults and `font-sans`; do not reduce interactive text below repository defaults merely to match Pencil scale. |
| Field labels | Plus Jakarta Sans, 11–12, weight 500–600 | Existing `Label`; `text-sm font-medium text-foreground`. |
| Helper/status copy | Plus Jakarta Sans, 10–12, normal | `text-sm text-muted-foreground`; error copy uses `text-destructive`. |
| Button labels | Plus Jakarta Sans, 12–14, weight 600 | Existing `Button`; retain its typography and accessible minimum height. |
| Technical key | Small muted text in the field row | `font-mono text-xs text-muted-foreground`; the only monospaced editor content. |

Repository text sizing and accessibility take precedence over Pencil's 10–11px logical labels. Preserve hierarchy through semantic roles and weight, not undersized text.

## Reusable component mapping

| Pencil source/component | Extracted construction | HMS implementation | Required configuration |
| --- | --- | --- | --- |
| `T8deb` — Sidebar Admin | 200px shell navigation using sidebar palette | Existing authenticated application shell | Reuse unchanged; editor starts in the shell's content slot. |
| `AmBqd` — Nav Bar | 56px shell bar with search, notification and avatar | Existing application navigation widget | Reuse unchanged; do not duplicate search or account controls. |
| `SQoVa` — Button/Primary/Default | `$primary`, pill radius, Plus Jakarta 14/600, optional icon | `Button` default variant plus shared `Icon` | Use `size='sm'` where the Pencil control is compact and add `rounded-full`; use `px-6` for dialog primary actions. |
| `yR4IE` — Button/Outline/Default | Transparent, primary 1.5px stroke, pill radius | `Button` brand variant | Use `size='sm'`, `rounded-full px-6`; this existing variant supplies primary border/text and hover inversion. |
| `JoVda` — Button/Destructive/Default | Destructive surface, pill radius, white content | `Button` destructive variant | Intentionally replace Pencil's solid/white treatment with the shared translucent destructive surface and destructive-colored text; add `rounded-full` and never apply `$destructive-muted` as a raw color. |
| Pencil cards/field rows | `$card`, `$border`, radius 8–10, subtle shadow | `Card`, `CardHeader`, `CardContent` | Add `border border-border shadow-2xs`; use `rounded-lg` for the 12px HMS card radius. |
| Pencil text fields | Card fill, input stroke, radius 6–8 | `Input`, `Textarea`, `Select` | Use default border/focus/disabled behavior; descriptions use `Label` plus helper text. |
| Availability/default toggles | Primary checked state, input unchecked state | `Switch` | Use the existing component without color overrides; always pair with a visible label and disabled explanation. |
| Required controls | Primary checked state | `Checkbox` | Use the existing component and associated `Label`. |
| Fields/Preview switcher | Underlined active item in page frame | `Tabs`, `TabsList variant='line'`, `TabsTrigger`, `TabsContent` | Preserve keyboard activation, active indication and full-width divider. |
| Type/status pills | Radius 999 with semantic surface/foreground | `Badge` or a local CVA using only the mappings below | Always include the textual type/status; color is supplementary. |
| Field and recovery dialogs | 560px logical width, `$card`, 12px radius, border, 0/8/24 shadow | Existing `Dialog` composition | `DialogContent` with `sm:max-w-[560px] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-lg border border-border bg-popover p-0 ring-0 shadow-lg`; body owns vertical scrolling. |
| Removal dialog | 440px logical width, otherwise same dialog treatment | Existing `Dialog` composition | Same recipe with `sm:max-w-[440px]`. |

The 560px field-dialog width, 440px removal-dialog width, viewport-height calculation and 70px save-bar minimum encode authoritative frame constraints that have no semantic Tailwind token. They are the only feature-added arbitrary layout values in this handoff; `DialogContent` already owns its shared `max-w-[calc(100%-2rem)]` viewport-width constraint. Colors, radii and shadows remain semantic.

## Field-type badge mapping

Pencil defines light-only per-type variables that do not exist in `global.css`. They are recorded below for traceability, but the implementation must use the existing theme-aware fallback. This preserves dark mode and avoids expanding global design authority for a feature-local distinction.

| Field type | Pencil background / foreground | HMS theme-aware implementation |
| --- | --- | --- |
| Short text | `$field-type-text-bg` (`$highlight`) / `$field-type-text-fg` (`$highlight-foreground`) | Local badge class `border-transparent bg-highlight text-highlight-foreground`. |
| Long text | `#CCFBF1` / `#115E59` | `Badge variant='success'`. |
| Date | `#F3E8FF` / `#6B21A8` | `Badge variant='info'`. |
| Sim/Não | `#DBEAFE` / `#1E40AF` | `Badge variant='info'`; label/icon distinguishes it from Date. |
| Multiple selection | `#FEF3C7` / `#92400E` | `Badge variant='attention'`. |
| Single selection | `#FFE4E6` / `#9F1239` | `Badge variant='waiting'`. |
| Integer | `#E2E8F0` / `#334155` | `Badge variant='secondary'`. |
| BRL currency | `#CFFAFE` / `#155E75` | Local badge class `border-transparent bg-highlight text-highlight-foreground`. |
| Percentage | `#FFEDD5` / `#9A3412` | `Badge variant='attention'`; textual label distinguishes it from Multiple selection. |

All nine type selectors are enabled in both Consulta and Formalização. Use the selected field-type color for the active pill and neutral theme-aware styling for the remaining enabled choices; do not represent an unavailable state that is not part of the current contract.

## Surface implementation recipes

| Surface | Structure and components | Tokens/layout | States and accessibility |
| --- | --- | --- | --- |
| Editor page (`iX5sr`) | Existing shell → breadcrumb → heading → save bar → identification `Card` → line `Tabs` → field list or preview | Content container follows existing shell width; `space-y-6`; cards use `border-border bg-card shadow-2xs`; heading recipe above | One `h1`; loading/error/not-found replace feature content only; availability has a visible disabled reason. |
| Identification | Responsive form grid using `Label`, `Input`, `Select`, `Textarea`, `Switch` | Wide layout may use two columns; description/topics span available width; narrow layout is one column | Validation message immediately follows its control and is connected with `aria-describedby`. Persisted stage is read-only with explanation. |
| Field row | Semantic list item, drag handle, label/type/required/key metadata and named edit/remove/move controls | `bg-card border-border rounded-lg`; `gap-3`; action buttons use ghost/icon sizes | Drag handle is not the only reorder mechanism; explicit up/down controls, localized announcements and visible focus are mandatory. |
| Save bar (`avpzp`, `TN5wx`, `Ew8qq`, `AYJ95`) | Status/live region on the left; primary and destructive actions on the right | `sticky bottom-0 z-20 min-h-[70px] border-t border-border bg-card px-7 py-4 shadow-sm`; `rounded-md` only when detached from viewport edge | Saved, dirty, saving and failure copy comes from the four references. Narrow layout wraps/stacks status above actions; actions remain reachable. |
| Field dialog | `DialogHeader`, scrollable form body, `DialogFooter`; type choices, type-specific controls and optional default | Content adds `flex flex-col`; header `px-5 pt-5 pb-4`; body `min-h-0 flex-1 overflow-y-auto px-5 py-4.5`; footer `border-t border-border px-5 py-4`; gap scale uses multiples of the HMS 4px base | The dialog owns RHF, validation and type switching. It composes grouped text, date, boolean, selection and numeric configuration widgets; these children render typed bindings and do not create independent forms. Initial focus targets the first invalid field or label. Escape/cancel returns focus. Pending submit disables dismissal that would lose input. |
| Options editor | Ordered option rows using `Input`, drag and move controls, delete button, add action | Rows use `gap-2`; controls inherit input/card tokens | Errors and announcements name the option. Removing a defaulted option requires confirmation. |
| Preview | Existing `DynamicFormFieldsSection` in a non-persisting local projection | Reuse its grid/control tokens; do not create parallel field renderers | Preview defaults are local; disabled/read-only semantics must remain understandable. |
| Removal dialog (`Lcpwf`) | Destructive dialog header, field/stage copy, impact callout, cancel/remove footer | Standard dialog recipe; impact callout uses `bg-accent text-accent-foreground`; removal uses destructive button | Loading/error/retry remain inside the dialog. Usage is informational. Initial focus is Cancel, and focus returns to the selected row. |
| Unsaved/stale/delete dialogs | Same dialog family as removal | No new visual language; semantic warning/destructive tokens only | Use the exact action sets from the Spec, focus trap/return and pending/error announcements. |

The exact 70px save-bar minimum and feature-specific dialog width/viewport-height calculations encode authoritative frame constraints that have no semantic Tailwind token. They are the only feature-added arbitrary layout values in these recipes; the viewport-width calculation comes unchanged from shared `DialogContent`. Colors, radii, spacing and shadows remain semantic.

## Icon mapping

Use the shared HMS `Icon` widget and its registered `IconName` values; feature widgets must not import `lucide-react`, use font icons, or author SVGs. The semantic substitutions below intentionally prefer the existing registry over adding feature-only icon names.

| Intent | Pencil icon | HMS `IconName` | Size contract |
| --- | --- | --- | --- |
| Add field/option | `plus` or `circle-plus` | `plus` | 12–16px; normally inherit shared button size. |
| Save/saved | `save`, `cloud-check` | `check` / `check-circle-2` | 14px action; 13px status. The visible button/status text remains authoritative. |
| Delete/remove | `trash-2`, `archive` | `trash-2` | 12–14px action; 17px removal callout. |
| Reorder | `grip-vertical` | `list-ordered`; explicit controls use `arrow-up` / `arrow-down` | 13–14px plus an accessible control name; the icon is supplementary. |
| Edit | `pencil` | `pencil` | 12–14px. |
| Close | `x` | `x` | Existing `DialogContent` close control remains authoritative. |
| Information | `info` | `info` | 14px. |
| Saving/retry/error | `loader-circle`, `rotate-cw`, `circle-alert` | `refresh-cw` / `alert-circle` | 13–14px; spin `refresh-cw` only while pending and respect reduced motion. |

## Responsive and state contract

| Concern | Wide reference | Required narrow/theme behavior |
| --- | --- | --- |
| Page | `iX5sr`, 1440×1200, 200px sidebar and 1184px feature width | Reuse the shell's responsive behavior; feature content becomes one column, never fixes 1184px, and has no horizontal page overflow. |
| Save bar | 1184×70 logical | Remains sticky/reachable; status and actions may wrap or stack; buttons retain 44px repository touch target. |
| Field dialog | 560px logical | Inherit shared `DialogContent`'s `max-w-[calc(100%-2rem)]`; the internal body scrolls within `100dvh`; footer actions stack only when needed. |
| Removal dialog | 440px logical | Same viewport constraint; impact copy wraps without clipping. |
| Dark mode | Not represented in Pencil | Use existing CSS variables and component variants exclusively; do not transform the recorded Pencil hex values. |
| Focus | Not fully represented in static frames | Existing `ring`, `aria-invalid` and Radix focus behavior is authoritative. |
| Motion | Pending spinner and sortable motion implied | Respect `prefers-reduced-motion`; status and order changes remain communicated without animation. |

## Visual inventory and interpretation

| Surface | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions |
| --- | --- | --- | --- |
| Editor | Application shell; breadcrumb; heading/subtitle; sticky save status/actions; identification card; availability switch; name, immutable-on-edit stage, area, ordered topic multi-select and suggestion description; field count/add action; Fields/Preview tabs; ordered field rows with required/type/key metadata and edit/reorder/remove actions. | Create and edit modes share the surface; edits update the local preview immediately; availability is disabled while new, dirty or saving. | The reference is a saved Consultation form. New/empty, Formalization, narrow, loading, forbidden, not-found and validation-error variants follow the explicit Spec state contract rather than an unreferenced Pencil composition. |
| Field dialog | Context sentence naming stage/area/topics; label/question; nine visible type choices; type-specific explanation and controls; help/description; placeholder where applicable; required control; cancel/confirm actions. | Consulta and Formalização expose all nine types enabled. Editing may change type after confirmed incompatible-configuration removal. | Optional defaults for all types are an approved 2026-09-15 extension: add a type-compatible `Resposta padrão (opcional)` control using existing form primitives without changing the Pencil source. Conditional-required rules are not exposed by this editor. |
| Options editor | Ordered option inputs, drag handles, removal controls and add-option action. | Pointer/touch and keyboard sorting; explicit move buttons; option removal confirms when it clears a configured default. | Technical option UUID/value is server-owned and never displayed or editable. |
| Save states | Saved, dirty, pending and recoverable failure copy/actions from the four footer nodes. | Save is enabled only for valid dirty state; retry reuses the failed snapshot’s operation key; editing after failure creates a new snapshot/key. | Stale conflicts use the approved dedicated dialog rather than the generic failure footer alone. |
| Removal | Destructive title naming the field, permanence explanation, total/in-progress usage callout and two actions. | Impact loads on open; failure is recoverable; removal is local until the next model save. | Usage is informational and never blocks removal; historical snapshots/answers remain untouched. |

## Supplemental coverage decisions

| Proposed route/surface/state | Role/fixture and viewport | Why the supplied references are insufficient | Coverage | Decision |
| --- | --- | --- | --- | --- |
| New editor, empty and first valid field | Administrator; 1440×1200 | `iX5sr` contains an existing six-field form only. | FR-02/FR-04; AC-02/AC-05; MV-01 | Recommended supplemental runtime screenshot; deferred to `evaluation.md` because empty-state behavior and copy are fixed by the Spec. |
| Formalization editor with all nine types | Administrator; 1440×1200 | The page frame is Consultation, while four dialogs demonstrate Formalization context independently. | FR-04/FR-05; AC-05/AC-06; MV-02 | Recommended supplemental runtime screenshot; deferred to `evaluation.md`. |
| Validation errors and all-type Consultation matrix | Administrator; 1440×1200 | No supplied frame shows invalid controls or the complete all-enabled type matrix. | FR-04/FR-06/FR-14; AC-05/AC-06/AC-14 | Recommended supplemental runtime screenshot; approved visual assumption uses existing HMS error primitives. |
| Stale-version and unsaved-navigation dialogs | Administrator; 1440×900 | No supplied frame covers either approved recovery decision. | FR-10/FR-11; AC-10/AC-11; MV-03 | Recommended supplemental runtime screenshot; approved visual assumption uses existing alert-dialog primitives and exact Spec copy. |
| Narrow editor and dialogs | Administrator; 320×800 | No narrow Pencil frame exists. | FR-14; AC-14; MV-04 | Recommended supplemental runtime screenshot; responsive behavior was explicitly approved and is defined by the Spec. |
| Loading, not-found, forbidden and generic failure | Administrator/attendant; 1440×900 | The supplied bundle shows only loaded editor and save states. | FR-01/FR-02/FR-14; AC-01/AC-02/AC-03/AC-15; MV-02/MV-05 | Recommended supplemental runtime screenshots; use established HMS feedback surfaces and capture material states in `evaluation.md`. |

## Layout inspection

Pencil structural inspection reported no layout problems for the four save bars, nine field dialogs, or removal dialog. Node `iX5sr` reported one partially clipped descendant, shell notification badge `bBlMF/m7pGK`; visual inspection confirms it is an intentional badge overlap in the unchanged application header and not a feature-region overflow. The implementation must not reproduce any page-level clipping or horizontal overflow.
