# Case history design reference

Pencil document `/Ubuntu-22.04/home/petros/projects/hms/design/hms.pen`, node T3XLf7 (Caso — Histórico), inspected via get_app_state/execute on2026-10-13. Header card `w5wNCS`: Histórico do caso, description, Todos os eventos selector, Buscar no histórico, Registrar andamento. Timeline `FsB8z`: date bands and event-count text, rows with icon/title/time/description/author, Carregar mais.1200×1050 reference uses HMS fonts/variables. No supplied manual-entry dialog node: adapt current shared Dialog/Input/Textarea/source-option primitives to explicit occurrence/description/optional references, preserve confirmation/error/focus/mobile semantics. Actual data replaces all design examples.390×844 stacks toolbar/action; timeline text wraps, body naturallyscrolls. Source/history permissions and closed/Admin write behavior come from Spec rather than decorative designcontrols.

Reference saved as [T3XLf7.png](T3XLf7.png),1200×1050 at1×, inspected as a feature-local source image; state History with persisted event examples, maps CA-05/VIS-01 and Manual desktop/mobile. No local encrypted .pen shell reads. Fresh implementation artifacts belong ignored apps/web/.playwright-cli/screenshots and logs.

## Delivery handoff — 2026-10-16

The current isolated candidate is `feat/case-history-core` in `.worktrees/case-history-core`, containing only the Core/Validation delivery slice and this feature documentation. No task-owned server, test, browser, or Vite process is active. The shared root checkout contains unrelated staged and unstaged changes and must remain untouched.

Next: publish the Core/Validation slice to `develop`, verify CI on its current PR head, then continue the dependent Server and Web slices after the appropriate predecessors merge. Recalculate the full TypeScript diff against `develop` for every slice. The feature remains in progress; mutation checks remain blocked per the user's instruction.
