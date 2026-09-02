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

export type DocumentPackageConfirmationDialogProps = {
  open: boolean
  isPending?: boolean
  documentsCount: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const DocumentPackageConfirmationDialog = ({
  open,
  isPending = false,
  documentsCount,
  onOpenChange,
  onConfirm,
}: DocumentPackageConfirmationDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className='font-serif text-2xl text-brand'>
          Confirmar pacote documental?
        </AlertDialogTitle>
        <AlertDialogDescription>
          O pacote está pronto para confirmação com {documentsCount}{' '}
          {documentsCount === 1 ? 'documento selecionado' : 'documentos selecionados'}.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <p className='rounded-lg bg-highlight p-4 text-sm text-highlight-foreground'>
        A confirmação exige versões aprovadas ou rejeitadas da revisão atual e não inicia
        assinaturas nem envia mensagens.
      </p>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Confirmando…' : 'Confirmar pacote'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
