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
import { useAvailabilityDynamicFormDialog } from './use-availability-dynamic-form-dialog'
import type { AvailabilityDynamicFormDialogProps } from './types'

export type { AvailabilityDynamicFormDialogProps } from './types'

export const AvailabilityDynamicFormDialog = (
  props: AvailabilityDynamicFormDialogProps,
) => {
  const { handleOpenChange, handleRetryImpact, handleConfirm, formatImpact, isDisabled } =
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
            {props.isMutationPending ? 'Salvando…' : 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
