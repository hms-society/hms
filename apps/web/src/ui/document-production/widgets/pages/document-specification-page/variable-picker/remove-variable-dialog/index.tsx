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
import type { DocumentTemplateVariable } from '@hms/core/document-production/domain/structures'

type RemoveVariableDialogProps = {
  variable: DocumentTemplateVariable | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const RemoveVariableDialog = ({
  variable,
  open,
  onOpenChange,
  onConfirm,
}: RemoveVariableDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Remover variável?</AlertDialogTitle>
        <AlertDialogDescription>
          {variable
            ? `A variável “${variable.label}” será removida do template e os tokens {{${variable.technicalName}}} serão apagados do conteúdo.`
            : 'A variável será removida do template.'}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction variant='destructive' onClick={onConfirm}>
          Remover variável
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
