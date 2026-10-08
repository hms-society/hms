import { Button } from '@/ui/shadcn/button'
import { DialogFooter } from '@/ui/shadcn/dialog'

export type SelectorFooterProps = {
  isSelectionDisabled: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const SelectorFooter = ({
  isSelectionDisabled,
  onCancel,
  onConfirm,
}: SelectorFooterProps) => (
  <DialogFooter className='-mx-4 -mb-4 shrink-0 border-border bg-popover sm:justify-end'>
    <Button type='button' variant='outline' className='rounded-full' onClick={onCancel}>
      Cancelar
    </Button>
    <Button
      type='button'
      className='rounded-full'
      disabled={isSelectionDisabled}
      onClick={onConfirm}
    >
      Selecionar colaborador
    </Button>
  </DialogFooter>
)
