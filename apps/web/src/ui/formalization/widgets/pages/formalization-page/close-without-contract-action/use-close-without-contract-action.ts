import { useState } from 'react'
import type { IntakeClosureReason } from '@hms/core/intake/domain/structures'

export type CloseWithoutContractActionProps = {
  isEnabled: boolean
  mutation: {
    isPending: boolean
    error: Error | null
    mutate: (input: { reason: IntakeClosureReason; notes?: string }) => void
  }
}

export function useCloseWithoutContractAction({
  isEnabled,
  mutation,
}: CloseWithoutContractActionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState<IntakeClosureReason | ''>('')
  const [notes, setNotes] = useState('')

  function handleOpenChange(nextOpen: boolean) {
    setIsOpen(nextOpen)
    if (!nextOpen && !mutation.isPending) {
      setReason('')
      setNotes('')
    }
  }

  function handleConfirm(nextReason: IntakeClosureReason, nextNotes: string) {
    mutation.mutate({
      reason: nextReason,
      notes: nextNotes.trim() || undefined,
    })
  }

  return {
    handleConfirm,
    handleOpenChange,
    isEnabled,
    isOpen,
    isPending: mutation.isPending,
    notes,
    onNotesChange: setNotes,
    onReasonChange: setReason,
    reason,
    error: mutation.error,
  }
}
