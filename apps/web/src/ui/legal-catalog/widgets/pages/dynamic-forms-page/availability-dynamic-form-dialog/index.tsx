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
import { useAvailabilityDynamicFormDialog } from './use-availability-dynamic-form-dialog'
import type { AvailabilityDynamicFormDialogProps } from './types'

export type { AvailabilityDynamicFormDialogProps } from './types'

export const AvailabilityDynamicFormDialog = (
  props: AvailabilityDynamicFormDialogProps,
) => {
  const { handleOpenChange, handleConfirm, isDisabled } =
    useAvailabilityDynamicFormDialog(props)
  const targetStatus = props.form?.status === 'available' ? 'indisponível' : 'disponível'

  return (
    <AlertDialog open={props.open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tornar formulário {targetStatus}</AlertDialogTitle>
          <AlertDialogDescription>
            {props.form?.name} ficará {targetStatus}. Os usos históricos serão
            preservados.
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
            {props.isMutationPending ? 'Salvando…' : 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
