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
import type { DynamicFormStaleVersionDialogProps } from '../types'
import { useDynamicFormStaleVersionDialog } from './use-dynamic-form-stale-version-dialog'
export function DynamicFormStaleVersionDialog(props: DynamicFormStaleVersionDialogProps) {
  const value = useDynamicFormStaleVersionDialog(props)
  return (
    <AlertDialog
      open={props.open}
      onOpenChange={(open) => !open && props.onContinueEditing()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Versão desatualizada</AlertDialogTitle>
          <AlertDialogDescription>
            Este formulário mudou no servidor. Sua versão era {props.expectedVersion} e a
            atual é {props.currentVersion}. Suas alterações permanecem nesta tela.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {props.errorMessage && (
          <p role='alert' className='text-sm text-destructive'>
            {props.errorMessage}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={props.onContinueEditing}>
            Continuar editando
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={!value.canReload}
            onClick={() => void props.onReloadServerVersion()}
          >
            {props.isReloading ? 'Recarregando…' : 'Recarregar versão do servidor'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
