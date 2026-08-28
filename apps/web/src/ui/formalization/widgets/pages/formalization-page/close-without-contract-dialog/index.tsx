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
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Textarea } from '@/ui/shadcn/textarea'

import {
  useCloseWithoutContractDialog,
  type CloseWithoutContractDialogProps,
} from './use-close-without-contract-dialog'

export type { CloseWithoutContractDialogProps } from './use-close-without-contract-dialog'

export const CloseWithoutContractDialog = (props: CloseWithoutContractDialogProps) => {
  const {
    error,
    isPending = false,
    notes,
    onNotesChange,
    onOpenChange,
    open,
    reason,
  } = props
  const {
    closureReasonLabels,
    handleConfirm,
    handleReasonChange,
    hasReasonError,
    reasonErrorId,
  } = useCloseWithoutContractDialog(props)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='font-serif text-2xl text-brand'>
            Encerrar sem contratação?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Informe o motivo e as observações opcionais antes de encerrar esta
            Formalização.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='formalization-close-without-contract-reason'>
              Motivo do encerramento <span className='text-destructive'>*</span>
            </Label>
            <Select value={reason} onValueChange={handleReasonChange}>
              <SelectTrigger
                id='formalization-close-without-contract-reason'
                aria-required='true'
                aria-invalid={hasReasonError}
                aria-describedby={hasReasonError ? reasonErrorId : undefined}
                className='w-full'
              >
                <SelectValue placeholder='Selecione um motivo' />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(closureReasonLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasReasonError && (
              <p id={reasonErrorId} role='alert' className='text-sm text-destructive'>
                Selecione um motivo para encerrar a Formalização.
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='formalization-close-without-contract-notes'>
              Observações <span className='text-muted-foreground'>(opcional)</span>
            </Label>
            <Textarea
              id='formalization-close-without-contract-notes'
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder='Adicione informações complementares sobre o encerramento.'
              rows={4}
            />
          </div>

          <p className='rounded-lg bg-destructive/10 p-4 text-sm text-destructive'>
            Esta ação é definitiva: a Formalização será cancelada e o Intake será fechado
            sem contratação. O conteúdo ficará somente para consulta.
          </p>

          {error && (
            <p role='alert' className='text-sm text-destructive'>
              {error.message}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? 'Encerrando…' : 'Encerrar sem contratação'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
