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

import {
  useRemoveAllSignatureFieldsDialog,
  type RemoveAllSignatureFieldsDialogProps,
} from './use-remove-all-signature-fields-dialog'

export type { RemoveAllSignatureFieldsDialogProps } from './use-remove-all-signature-fields-dialog'

export const RemoveAllSignatureFieldsDialog = (
  props: RemoveAllSignatureFieldsDialogProps,
) => {
  const { handleConfirm } = useRemoveAllSignatureFieldsDialog(props)

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover todos os campos?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os campos de assinatura deste documento serão removidos. Será necessário
            adicioná-los novamente antes de salvar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={props.isPending}
            onClick={handleConfirm}
          >
            {props.isPending ? 'Removendo...' : 'Remover todos'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
