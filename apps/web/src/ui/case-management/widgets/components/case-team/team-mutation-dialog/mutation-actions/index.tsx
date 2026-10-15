import { Button } from '@/ui/shadcn/button'
import { DialogFooter } from '@/ui/shadcn/dialog'

export type MutationActionsProps = {
  isPending: boolean
  isRemove: boolean
  isDisabled: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const MutationActions = ({
  isPending,
  isRemove,
  isDisabled,
  onCancel,
  onConfirm,
}: MutationActionsProps) => (
  <DialogFooter>
    <Button
      type='button'
      variant='outline'
      className='rounded-full'
      disabled={isPending}
      onClick={onCancel}
    >
      Cancelar
    </Button>
    <Button
      type='button'
      variant={isRemove ? 'destructive' : 'default'}
      className='rounded-full'
      disabled={isDisabled}
      onClick={onConfirm}
    >
      {isPending ? 'Salvando…' : isRemove ? 'Remover do caso' : 'Confirmar'}
    </Button>
  </DialogFooter>
)
