import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'
import {
  type PendingVariableValuesDialogProps,
  usePendingVariableValuesDialog,
} from './use-pending-variable-values-dialog'

export type {
  PendingVariable,
  PendingVariableValuesDialogProps,
} from './use-pending-variable-values-dialog'

export function PendingVariableValuesDialog(props: PendingVariableValuesDialogProps) {
  const { canApply, handleSubmit, handleValueChange, onOpenChange, values } =
    usePendingVariableValuesDialog(props)

  return (
    <Dialog open={props.open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Inserir valores pendentes</DialogTitle>
          <DialogDescription>
            Preencha os dados que faltam. Cada valor substituirá todas as ocorrências
            correspondentes no texto da peça.
          </DialogDescription>
        </DialogHeader>
        <form className='space-y-4' onSubmit={handleSubmit}>
          {props.variables.map((variable, index) => {
            const inputId = `pending-variable-${index}`

            return (
              <div key={variable.marker} className='space-y-1.5'>
                <Label htmlFor={inputId}>{variable.label}</Label>
                <p className='text-xs text-muted-foreground'>
                  Marcador: <code>{variable.marker}</code>
                </p>
                <Input
                  id={inputId}
                  autoComplete='off'
                  value={values[variable.marker] ?? ''}
                  onChange={(event) =>
                    handleValueChange(variable.marker, event.currentTarget.value)
                  }
                  placeholder={`Informe ${variable.label.toLocaleLowerCase('pt-BR')}`}
                  required
                />
              </div>
            )
          })}
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type='submit' disabled={!canApply}>
              <Icon name='check' /> Inserir valores
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
