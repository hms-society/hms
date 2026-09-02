import type { IntakeClosureReason } from '@hms/core/intake/domain/structures'
import { useState, type MouseEvent } from 'react'

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

const CLOSURE_REASON_LABELS: Record<IntakeClosureReason, string> = {
  out_of_scope: 'Fora do escopo',
  legally_unviable: 'Inviável juridicamente',
  client_withdrew: 'Desistência do cliente',
  unable_to_contact: 'Sem contato',
  no_show: 'Não compareceu',
  referred: 'Encaminhado',
  other: 'Outro',
}

export function useCloseWithoutContractDialog({
  notes,
  onConfirm,
  onReasonChange,
  reason,
}: CloseWithoutContractDialogProps) {
  const [hasReasonError, setHasReasonError] = useState(false)
  const reasonErrorId = 'formalization-close-without-contract-reason-error'

  function handleReasonChange(nextReason: string) {
    setHasReasonError(false)
    onReasonChange(nextReason as IntakeClosureReason | '')
  }

  function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    if (!reason) {
      event.preventDefault()
      setHasReasonError(true)
      return
    }

    onConfirm(reason, notes)
  }

  return {
    closureReasonLabels: CLOSURE_REASON_LABELS,
    handleConfirm,
    handleReasonChange,
    hasReasonError,
    reasonErrorId,
  }
}
