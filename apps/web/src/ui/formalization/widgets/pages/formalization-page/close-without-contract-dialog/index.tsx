import { useState, type MouseEvent } from 'react'
import type { IntakeClosureReason } from '@hms/core/intake/domain/structures'

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

const CLOSURE_REASON_LABELS: Record<IntakeClosureReason, string> = {
  out_of_scope: 'Fora do escopo',
  legally_unviable: 'Inviável juridicamente',
  client_withdrew: 'Desistência do cliente',
  unable_to_contact: 'Sem contato',
  no_show: 'Não compareceu',
  referred: 'Encaminhado',
  other: 'Outro',
}

export type CloseWithoutContractDialogProps = {
  open: boolean
  isPending?: boolean
  reason: IntakeClosureReason | ''
  notes: string
  error?: Error | null
  onOpenChange: (open: boolean) => void
  onReasonChange: (reason: IntakeClosureReason | '') => void
  onNotesChange: (notes: string) => void
  onConfirm: (reason: IntakeClosureReason, notes: string) => void
}

export const CloseWithoutContractDialog = ({
  open,
  isPending = false,
  reason,
  notes,
  error,
  onOpenChange,
  onReasonChange,
  onNotesChange,
  onConfirm,
}: CloseWithoutContractDialogProps) => {
  const [hasReasonError, setHasReasonError] = useState(false)
  const reasonErrorId = 'formalization-close-without-contract-reason-error'

  function handleReasonChange(nextReason: string) {
    setHasReasonError(false)
    onReasonChange(nextReason as IntakeClosureReason)
  }

  function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    if (!reason) {
      event.preventDefault()
      setHasReasonError(true)
      return
    }

    onConfirm(reason, notes)
  }

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
                {Object.entries(CLOSURE_REASON_LABELS).map(([value, label]) => (
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
