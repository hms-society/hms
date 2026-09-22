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

export type RemoveSignatureSignatoryDialogProps = {
  open: boolean
  name: string
  isPending?: boolean
  error?: unknown
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const RemoveSignatureSignatoryDialog = ({
  open,
  name,
  isPending = false,
  error,
  onOpenChange,
  onConfirm,
}: RemoveSignatureSignatoryDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Remover signatário?</AlertDialogTitle>
        <AlertDialogDescription>
          A remoção de <strong>{name}</strong> também remove suas atribuições de
          documentos.
        </AlertDialogDescription>
      </AlertDialogHeader>
      {Boolean(error) && (
        <p role='alert' className='text-sm text-destructive'>
          Não foi possível remover o signatário. Tente novamente.
        </p>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
        <AlertDialogAction variant='destructive' disabled={isPending} onClick={onConfirm}>
          {isPending ? 'Removendo...' : 'Remover signatário'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
