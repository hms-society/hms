# Dynamic forms administration — design manifest

The canonical editable source is `design/hms.pen`. The PNG files in this directory are immutable implementation references exported at 2× after the product decisions were confirmed. Application chrome must reuse the existing `AppLayout`; the Pencil sidebar is contextual, not a replacement for the HMS shell.

## Reference inventory

| Reference | Pencil file/node | State | Source viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Catalog page | `design/hms.pen` / `DWg64` | Populated, page 1 | 1440×900 | [DWg64.png](./DWg64.png) | `/formularios-dinamicos` page | Existing shell, inputs, selects, table, badges, pagination, buttons | Desktop visual comparison; headings, name-only search, separate area/topic columns, five rows and actions |
| Duplicate dialog | `design/hms.pen` / `V7nH8` | Initial valid suggested name | 440 px dialog | [V7nH8.png](./V7nH8.png) | Duplicate action | Existing dialog, field, informational callout, primary/secondary buttons | Keyboard focus, duplicate-name conflict, pending and success states |
| Unavailable confirmation | `design/hms.pen` / `WjuC6` | Available form with consultation impact | 440 px dialog | [WjuC6.png](./WjuC6.png) | Change availability | Existing alert dialog and destructive button | Impact totals, historical-preservation copy, cancellation and confirmation |
| Delete confirmation | `design/hms.pen` / `aSbsz` | Form with consultation and formalization impact | 440 px dialog | [aSbsz.png](./aSbsz.png) | Permanent deletion | Existing alert dialog and destructive button | Irreversibility, both impact groups, history preservation and focus return |
| Unavailable-form menu | `design/hms.pen` / `iu2Vg` | Row overflow for unavailable form | 220 px menu | [iu2Vg.png](./iu2Vg.png) | Row actions | Existing dropdown menu | Duplicate, make available and delete labels; arrow-key and Escape behavior |
| Available-form menu | `design/hms.pen` / `tErvw` | Row overflow for available form | 220 px menu | [tErvw.png](./tErvw.png) | Row actions | Existing dropdown menu | Duplicate, make unavailable and delete labels; destructive separation |

## Screenshot analysis

| Surface | Required visible inventory | Interaction/state contract | Allowed deviation |
| --- | --- | --- | --- |
| Catalog page | Title, supporting copy, `Novo formulário`, `Buscar por nome`, stage/status filters, columns `Formulário`, `Etapa`, `Área jurídica`, `Temas`, `Campos`, `Estado`, `Ações`, explicit `Editar`, overflow and pagination | URL-owned filters/page; five rows per page; topic summary `principal +N`; status-dependent actions | Use the repository shell and design tokens; add the admin-only `Formulários dinâmicos` sidebar item even though the Pencil chrome is illustrative |
| Duplicate dialog | Source name, unique-name input, copied-content explanation, history notice | Suggested `<nome> — cópia`; submit disabled while empty, conflicting or pending; conflict offers `Abrir formulário` | Validation and server-error copy may wrap according to existing form primitives |
| Availability dialog | Consequence, usage count and in-progress count | Only shown before making an available form unavailable; making an unavailable form available uses the menu action directly | Counts are live server data, not the example values in the PNG |
| Delete dialog | Irreversible consequence, consultation/formalization impact, historical preservation | Available for either status; confirmation deletes only the catalog definition and returns focus to the trigger | Counts are live server data; destructive semantics and hierarchy are fixed |
| Menus | Duplicate, status-dependent availability action, permanent delete | Explicit accessible labels, roving keyboard behavior and focus restoration | Existing HMS dropdown spacing and elevation tokens win over pixel copying |

## Supplemental state matrix

The user accepted repository-derived treatment for states that have no canonical Pencil frame. Each is required implementation and validation evidence, not a new product-design decision.

| State | Role/fixture | Exact viewport/theme | Why Pencil is insufficient | Required treatment | Traceability | Evidence class |
| --- | --- | --- | --- | --- | --- | --- |
| Loading | Admin; list request held pending | 1440×900, light | `DWg64` is populated only | Preserve page/filter geometry; show existing table skeleton and disable row operations | FR-10 / AC-09 | Required runtime screenshot |
| Empty catalog | Admin; zero total without filters | 1440×900, light | No empty frame | Existing empty-state primitive, `Nenhum formulário cadastrado`, and enabled `Novo formulário` | FR-10 / AC-09 | Required runtime screenshot |
| Filtered empty | Admin; non-empty catalog, unmatched URL search | 1440×900, light | No filtered state | Preserve filters and show `Nenhum formulário encontrado` with clear-filters action | FR-03, FR-10 / AC-03, AC-09 | Required runtime screenshot |
| Recoverable error | Admin; list request fails once | 1440×900, light | No error frame | Existing inline error primitive with `Tentar novamente`; retain URL state | FR-10 / AC-09 | Required runtime screenshot |
| Mutation pending | Admin; duplicate request held pending | 440 px dialog, light | `V7nH8` is idle | Keep dialog open; disable close/submit that could double-submit; announce progress | FR-04, FR-10 / AC-04, AC-09 | Required interaction evidence |
| Name conflict | Admin; normalized name exists | 440 px dialog, light | No conflict frame | Inline field error, server-conflict announcement and `Abrir formulário` action | FR-05 / AC-05 | Required runtime screenshot |
| Narrow list | Admin; populated page | 320×800, light | Desktop frame only | Responsive cards or contained table scrolling; no page overflow; every value/action reachable | FR-10 / AC-10 | Required runtime screenshot |
| Dark theme | Admin; populated page and one dialog | 1440×900, dark | Pencil is light only | Same hierarchy through documented semantic tokens; no literal color copying | FR-10 / AC-02 | Required runtime screenshot |
| New placeholder | Admin; `/formularios-dinamicos/novo` | 1440×900, light | Editor excluded from Pencil/source | HMS page shell, editor-forthcoming message and back-to-list action | FR-01 / AC-01 | Required route screenshot |
| Existing placeholder | Admin; valid form ID route | 1440×900, light | Editor excluded from Pencil/source | Same placeholder with form context and back-to-list action | FR-01, FR-05 / AC-01, AC-05 | Required route screenshot |

All six saved assets were visually inspected after export. The primary page and dialogs have no clipping, overlap or contrast defect; transparent padding/cropping around standalone menu exports is non-contractual, and menu content/order is authoritative from the editable nodes and the inventory above.
