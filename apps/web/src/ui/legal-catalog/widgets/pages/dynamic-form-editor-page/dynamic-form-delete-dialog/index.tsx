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
import type { DynamicFormDeleteDialogProps } from '../types'
import { useDynamicFormDeleteDialog } from './use-dynamic-form-delete-dialog'
export function DynamicFormDeleteDialog(props: DynamicFormDeleteDialogProps) {
  const { isDisabled } = useDynamicFormDeleteDialog(props)

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
          <AlertDialogDescription>
            {props.isDirty ? 'Há alterações não salvas. ' : ''}A exclusão de{' '}
            <strong>{props.form?.name}</strong> é irreversível. O histórico de usos será
            preservado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {props.errorMessage && (
          <p role='alert' className='text-sm text-destructive'>
            {props.errorMessage}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={isDisabled}
            onClick={props.onDeleted}
          >
            {props.isDeleting ? 'Excluindo…' : 'Excluir formulário'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
