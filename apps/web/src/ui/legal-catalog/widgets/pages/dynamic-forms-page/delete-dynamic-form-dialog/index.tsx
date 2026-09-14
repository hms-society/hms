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
import { Button } from '@/ui/shadcn/button'
import { useDeleteDynamicFormDialog } from './use-delete-dynamic-form-dialog'
import type { DeleteDynamicFormDialogProps } from './types'

export type { DeleteDynamicFormDialogProps } from './types'

export const DeleteDynamicFormDialog = (props: DeleteDynamicFormDialogProps) => {
  const { handleOpenChange, handleRetryImpact, handleConfirm, formatImpact, isDisabled } =
    useDeleteDynamicFormDialog(props)

  return (
    <AlertDialog open={props.open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir formulário permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            A definição {props.form?.name} será removida. Consultas e formalizações
            históricas serão preservadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div aria-live='polite' className='space-y-2'>
          <p
            className={
              props.isImpactError
                ? 'text-sm text-destructive'
                : 'text-sm text-muted-foreground'
            }
            role={props.isImpactError ? 'alert' : undefined}
          >
            {formatImpact()}
          </p>
          {props.isImpactError && (
            <Button
              type='button'
              variant='outline'
              onClick={() => void handleRetryImpact()}
              disabled={props.isMutationPending}
            >
              Tentar novamente
            </Button>
          )}
        </div>
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
