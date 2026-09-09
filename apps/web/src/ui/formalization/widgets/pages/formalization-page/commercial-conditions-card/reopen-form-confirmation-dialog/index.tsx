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

export type ReopenFormConfirmationDialogProps = {
  open: boolean
  isPending?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const ReopenFormConfirmationDialog = ({
  open,
  isPending = false,
  onOpenChange,
  onConfirm,
}: ReopenFormConfirmationDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className='font-serif text-2xl text-brand'>
          Reabrir formulário?
        </AlertDialogTitle>
        <AlertDialogDescription>
          O formulário ficará disponível novamente para edição das condições comerciais.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <p className='rounded-lg bg-highlight p-4 text-xs text-highlight-foreground'>
        Os documentos ficarão bloqueados enquanto o formulário estiver aberto. Fechar sem
        alterar as respostas preserva o pacote; mudanças exigem novas versões dos
        documentos selecionados.
      </p>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Reabrindo…' : 'Reabrir formulário'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
