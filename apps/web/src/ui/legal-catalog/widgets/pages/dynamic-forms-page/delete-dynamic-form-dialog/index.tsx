import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { useDeleteDynamicFormDialog } from './use-delete-dynamic-form-dialog'
import type { DeleteDynamicFormDialogProps } from './types'

export type { DeleteDynamicFormDialogProps } from './types'

export const DeleteDynamicFormDialog = (props: DeleteDynamicFormDialogProps) => {
  const { handleOpenChange, handleConfirm, isDisabled } =
    useDeleteDynamicFormDialog(props)

  return (
    <AlertDialog open={props.open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir formulário permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            A definição {props.form?.name} será removida. O histórico de usos será
            preservado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {props.errorMessage && (
          <p role='alert' className='text-sm text-destructive'>
            {props.errorMessage}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.isMutationPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={isDisabled}
            onClick={(event) => {
              event.preventDefault()
              void handleConfirm()
            }}
          >
            {props.isMutationPending ? 'Excluindo…' : 'Excluir formulário'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
