import { Button } from '@/ui/shadcn/button'

import { CloseWithoutContractDialog } from '../close-without-contract-dialog'
import {
  type CloseWithoutContractActionProps,
  useCloseWithoutContractAction,
} from './use-close-without-contract-action'

export type { CloseWithoutContractActionProps }

export const CloseWithoutContractAction = (props: CloseWithoutContractActionProps) => {
  const {
    error,
    handleConfirm,
    handleOpenChange,
    isEnabled,
    isOpen,
    isPending,
    notes,
    onNotesChange,
    onReasonChange,
    reason,
  } = useCloseWithoutContractAction(props)

  return (
    <>
      <div className='flex justify-end'>
        <Button
          variant='ghost'
          className='text-muted-foreground'
          onClick={() => handleOpenChange(true)}
          disabled={!isEnabled}
        >
          Encerrar sem contratação
        </Button>
      </div>
      <CloseWithoutContractDialog
        open={isOpen}
        isPending={isPending}
        reason={reason}
        notes={notes}
        error={error}
        onOpenChange={handleOpenChange}
        onReasonChange={onReasonChange}
        onNotesChange={onNotesChange}
        onConfirm={handleConfirm}
      />
    </>
  )
}
