import type { MouseEvent } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ConfirmConsultationCompletionDialogProps = {
  open: boolean
  isConfirming?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
}

export const ConfirmConsultationCompletionDialog = ({
  open,
  isConfirming = false,
  onOpenChange,
  onConfirm,
}: ConfirmConsultationCompletionDialogProps) => {
  function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    void onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='gap-0 overflow-hidden p-0 sm:max-w-lg'>
        <AlertDialogHeader className='border-b border-border px-6 py-6 sm:px-7'>
          <AlertDialogMedia className='bg-highlight text-highlight-foreground'>
            <Icon name='check-circle-2' className='size-5' />
          </AlertDialogMedia>
          <AlertDialogTitle className='text-xl font-semibold text-foreground'>
            Finalizar consulta?
          </AlertDialogTitle>
          <AlertDialogDescription className='text-sm leading-6 text-muted-foreground'>
            A ficha de atendimento e o pacote de documentos já foram concluídos. Ao
            confirmar, a consulta será encerrada e não poderá voltar para edição.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className='border-t-0 bg-background px-6 py-4 sm:px-7'>
          <AlertDialogCancel disabled={isConfirming} className='rounded-full px-5'>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConfirming}
            className='rounded-full px-5'
          >
            {isConfirming ? 'Finalizando...' : 'Finalizar consulta'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
