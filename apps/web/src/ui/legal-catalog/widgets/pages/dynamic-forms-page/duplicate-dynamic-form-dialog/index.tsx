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
import { useDuplicateDynamicFormDialog } from './use-duplicate-dynamic-form-dialog'
import type { DuplicateDynamicFormDialogProps } from './types'

export type { DuplicateDynamicFormDialogProps } from './types'

export const DuplicateDynamicFormDialog = (props: DuplicateDynamicFormDialogProps) => {
  const {
    name,
    conflict,
    handleNameChange,
    handleSubmit,
    handleOpenChange,
    isInvalid,
    conflictError,
  } = useDuplicateDynamicFormDialog(props)
  const existingDynamicFormId = conflict?.existingDynamicFormId

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby='duplicate-dynamic-form-description'
        className='sm:max-w-[440px]'
      >
        <DialogHeader>
          <DialogTitle>Duplicar formulário</DialogTitle>
          <DialogDescription id='duplicate-dynamic-form-description'>
            O formulário {props.form?.name ?? ''} será copiado com todos os campos e
            regras.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <label htmlFor='dynamic-form-name' className='font-medium'>
            Nome do novo formulário *
          </label>
          <Input
            id='dynamic-form-name'
            value={name}
            onChange={handleNameChange}
            aria-invalid={Boolean(conflictError)}
            aria-describedby={conflictError ? 'dynamic-form-name-error' : undefined}
            disabled={props.isPending}
          />
          {conflictError && (
            <p
              id='dynamic-form-name-error'
              role='alert'
              className='text-sm text-destructive'
            >
              {conflictError}
            </p>
          )}
          {props.errorMessage && (
            <p role='alert' className='text-sm text-destructive'>
              {props.errorMessage}
            </p>
          )}
          {existingDynamicFormId && (
            <Button
              type='button'
              variant='link'
              onClick={() => props.onOpenExisting(existingDynamicFormId)}
            >
              Abrir formulário
            </Button>
          )}
          <p className='rounded-lg bg-muted p-3 text-sm text-muted-foreground'>
            A cópia começa indisponível. O histórico dos usos existentes não será
            alterado.
          </p>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={props.isPending}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={isInvalid}>
              {props.isPending ? 'Duplicando…' : 'Duplicar formulário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
