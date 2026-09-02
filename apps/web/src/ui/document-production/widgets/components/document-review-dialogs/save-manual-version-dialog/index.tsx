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

export type SaveManualVersionDialogProps = {
  open: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const SaveManualVersionDialog = ({
  open,
  isSaving,
  onOpenChange,
  onConfirm,
}: SaveManualVersionDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Salvar nova versão?</AlertDialogTitle>
        <AlertDialogDescription>
          O conteúdo será salvo como uma nova versão em revisão. A versão atual e sua
          vigência permanecem inalteradas.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          disabled={isSaving}
          onClick={(event) => {
            event.preventDefault()
            onConfirm()
          }}
        >
          {isSaving ? 'Salvando…' : 'Salvar nova versão'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
