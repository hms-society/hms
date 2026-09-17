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
import type { DynamicFormFieldRemovalDialogProps } from '../types'
import { useDynamicFormFieldRemovalDialog } from './use-dynamic-form-field-removal-dialog'
export function DynamicFormFieldRemovalDialog(props: DynamicFormFieldRemovalDialogProps) {
  const value = useDynamicFormFieldRemovalDialog(props)
  const field = props.field
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover campo?</AlertDialogTitle>
          <AlertDialogDescription>
            O campo <strong>{field?.label}</strong> será removido do próximo salvamento. O
            histórico não será alterado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {value.usageQuery.isFetching && (
          <p className='rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground'>
            Consultando o uso deste campo nas Formalizações…
          </p>
        )}
        {value.usageQuery.isError && (
          <div className='space-y-2 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground'>
            <p>Não foi possível consultar o uso deste campo nas Formalizações.</p>
            <button
              type='button'
              className='underline underline-offset-2'
              onClick={() => void value.usageQuery.refetch()}
            >
              Tentar novamente
            </button>
          </div>
        )}
        {value.usageQuery.data && (
          <p className='rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground'>
            {value.usageQuery.data.formalization.total === 0
              ? 'Nenhuma Formalização usa este campo.'
              : `Este campo é usado em ${value.usageQuery.data.formalization.total} Formalização(ões): ${value.usageQuery.data.formalization.total - value.usageQuery.data.formalization.inProgress} concluída(s) e ${value.usageQuery.data.formalization.inProgress} em andamento.`}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Manter campo</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={!value.canConfirm}
            onClick={() => field && props.onConfirm(field.clientId)}
          >
            Remover campo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
