import type { ChecklistTabState } from '../types'
import { ChecklistItemRow } from '../checklist-item-row'

export type ChecklistItemsProps = {
  readOnly: boolean
  state: ChecklistTabState
}

export const ChecklistItems = ({ readOnly, state }: ChecklistItemsProps) => (
  <div className='flex flex-col gap-3'>
    <h3 className='text-[12px] font-bold uppercase tracking-wider text-muted-foreground'>
      Itens obrigatórios
    </h3>
    <div className='flex flex-col gap-1.5'>
      {state.checklistItems.length ? (
        state.checklistItems.map((item) => (
          <ChecklistItemRow
            item={item}
            key={item.id}
            pendingCount={state.pendingCountByChecklistItemId.get(item.id) ?? 0}
            readOnly={readOnly}
            onOpen={state.handleOpenChecklistItemDetail}
            onValidate={state.handleValidateChecklistItem}
          />
        ))
      ) : (
        <div className='rounded-md border border-border bg-muted/30 px-3 py-4 text-xs text-muted-foreground'>
          Nenhum item de checklist documental foi encontrado para este caso.
        </div>
      )}
    </div>
  </div>
)
