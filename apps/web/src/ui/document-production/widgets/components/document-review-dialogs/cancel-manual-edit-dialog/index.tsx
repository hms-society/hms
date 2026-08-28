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

export type CancelManualEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const CancelManualEditDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: CancelManualEditDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Descartar edição?</AlertDialogTitle>
        <AlertDialogDescription>
          As alterações não salvas serão descartadas. A versão persistida não será
          alterada.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Continuar editando</AlertDialogCancel>
        <AlertDialogAction
          variant='destructive'
          onClick={(event) => {
            event.preventDefault()
            onConfirm()
          }}
        >
          Descartar alterações
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
