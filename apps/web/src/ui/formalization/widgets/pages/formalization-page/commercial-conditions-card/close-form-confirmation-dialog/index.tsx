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

export type CloseFormConfirmationDialogProps = {
  open: boolean
  isPending?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const CloseFormConfirmationDialog = ({
  open,
  isPending = false,
  onOpenChange,
  onConfirm,
}: CloseFormConfirmationDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className='font-serif text-2xl text-brand'>
          Fechar formulário?
        </AlertDialogTitle>
        <AlertDialogDescription>
          As respostas serão salvas e as condições comerciais serão confirmadas antes de
          liberar o pacote documental.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <p className='rounded-lg bg-highlight p-4 text-sm text-highlight-foreground'>
        Depois de fechar, você poderá revisar os documentos individualmente. Reabra o
        formulário para alterar as condições.
      </p>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Fechando…' : 'Fechar formulário'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
