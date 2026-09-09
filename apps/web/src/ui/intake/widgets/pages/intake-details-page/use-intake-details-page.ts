import { useState } from 'react'
import type { IntakeClosureReason } from '@hms/core/intake/domain/structures'

import { useStartFormalizationAction } from '@/ui/formalization/hooks/use-start-formalization-action'
import { useCloseIntakeWithoutContractAction } from '@/ui/intake/hooks/use-close-intake-without-contract-action'

import {
  useIntakeDetailsQuery,
  type IntakeDetailsData,
} from '@/ui/intake/hooks/use-intake-details-query'

export type IntakeDetailsContentController = {
  data: IntakeDetailsData
  isEditDialogOpen: boolean
  isClosureDialogOpen: boolean
  closureReason: IntakeClosureReason | ''
  closureNotes: string
  canEdit: boolean
  canClose: boolean
  isClosing: boolean
  isTransitioning: boolean
  closeError: Error | null
  actionError: Error | null
  responsibleName: string
  onEditDialogOpenChange: (open: boolean) => void
  onClosureDialogOpenChange: (open: boolean) => void
  onClosureReasonChange: (reason: IntakeClosureReason | '') => void
  onClosureNotesChange: (notes: string) => void
  onConfirmClosure: () => void
  onStartFormalization: () => void
}

export function useIntakeDetailsPage(intakeId: string) {
  const intakeQuery = useIntakeDetailsQuery(intakeId)
  const startFormalizationMutation = useStartFormalizationAction()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false)
  const [closureReason, setClosureReason] = useState<IntakeClosureReason | ''>('')
  const [closureNotes, setClosureNotes] = useState('')
  const intake = intakeQuery.data?.intake
  const { closeIntakeError, isClosingIntake, closeIntakeWithoutContract } =
    useCloseIntakeWithoutContractAction(intake?.id)

  async function handleConfirmClosure() {
    if (!intake || !closureReason) return

    await closeIntakeWithoutContract({
      closureNotes: closureNotes.trim() || undefined,
      closureReason,
      expectedVersion: intake.version,
    })
    setIsClosureDialogOpen(false)
    setClosureReason('')
    setClosureNotes('')
  }

  if (!intakeQuery.data) {
    return { intakeQuery, content: undefined }
  }

  const isTerminal =
    intakeQuery.data.intake.status === 'contracted' ||
    intakeQuery.data.intake.status === 'closed_without_contract'

  return {
    intakeQuery,
    content: {
      data: intakeQuery.data,
      isEditDialogOpen,
      isClosureDialogOpen,
      closureReason,
      closureNotes,
      canEdit: !isTerminal,
      canClose: !isTerminal,
      isClosing: isClosingIntake,
      isTransitioning: startFormalizationMutation.isPending,
      closeError: closeIntakeError,
      actionError: closeIntakeError ?? startFormalizationMutation.error,
      responsibleName:
        intakeQuery.data.responsible?.professionalName ?? 'Atendente não identificado',
      onEditDialogOpenChange: setIsEditDialogOpen,
      onClosureDialogOpenChange: setIsClosureDialogOpen,
      onClosureReasonChange: setClosureReason,
      onClosureNotesChange: setClosureNotes,
      onConfirmClosure: handleConfirmClosure,
      onStartFormalization: () =>
        startFormalizationMutation.mutate(intakeQuery.data.intake.id),
    } satisfies IntakeDetailsContentController,
  }
}
