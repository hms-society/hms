import type { ChecklistTabState } from '../types'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ComplementaryItemsProps = {
  readOnly: boolean
  state: ChecklistTabState
}

export const ComplementaryItems = ({ readOnly, state }: ComplementaryItemsProps) => (
  <div className='flex flex-col gap-3 border-t border-border pt-3'>
    <h3 className='text-[12px] font-bold uppercase tracking-wider text-muted-foreground'>
      Itens complementares do caso
    </h3>
    <div className='flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3'>
      <div className='flex min-w-0 flex-col gap-1'>
        {state.complementaryItems.length === 0 ? (
          <span className='text-[14px] text-muted-foreground'>
            Nenhum item complementar adicionado. Itens complementares são específicos
            deste caso e exigem justificativa — não alteram o template de origem.
          </span>
        ) : (
          state.complementaryItems.map((item) => (
            <span key={item} className='text-[14px] font-medium text-foreground'>
              {item}
            </span>
          ))
        )}
      </div>
      {!readOnly && (
        <Button
          variant='brand'
          size='xs'
          className='h-8 rounded-full bg-background text-[12px]'
          onClick={state.handleAddComplementaryItem}
        >
          <Icon name='plus' className='size-3' />
          Adicionar item
        </Button>
      )}
    </div>
  </div>
)
