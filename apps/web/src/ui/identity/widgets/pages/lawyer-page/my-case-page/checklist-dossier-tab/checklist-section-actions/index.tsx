import type { ChecklistTabState } from '../types'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ChecklistSectionActionsProps = { state: ChecklistTabState }

export const ChecklistSectionActions = ({ state }: ChecklistSectionActionsProps) => (
  <div className='flex flex-wrap justify-end gap-2'>
    <Button
      variant='brand'
      size='xs'
      className='h-8 rounded-full bg-background text-[12px]'
      onClick={state.handleOpenValidationDesk}
    >
      <Icon name='check-circle-2' className='size-3' />
      Mesa de Validação
      <Icon name='arrow-right' className='size-3' />
    </Button>
    <Button
      variant='brand'
      size='xs'
      className='h-8 rounded-full bg-background text-[12px]'
      onClick={state.handleFilterByCase}
    >
      Filtrado por este caso
      <Icon name='arrow-right' className='size-3' />
    </Button>
  </div>
)
