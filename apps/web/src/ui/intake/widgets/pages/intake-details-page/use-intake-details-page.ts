import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Intake } from '@hms/core/intake/domain/entities'
import type { IntakeClosureReason } from '@hms/core/intake/domain/structures'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useIntakeDetailsQuery, type IntakeDetailsData } from './use-intake-details-query'

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
  onConfirmContract: () => void
}

export function useIntakeDetailsPage(intakeId: string) {
  const intakeQuery = useIntakeDetailsQuery(intakeId)
  const { intakeService } = useRestContext()
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false)
  const [closureReason, setClosureReason] = useState<IntakeClosureReason | ''>('')
  const [closureNotes, setClosureNotes] = useState('')
  const intake = intakeQuery.data?.intake

  const closeMutation = useMutation({
    mutationFn: async () => {
      if (!intake) throw new Error('Não foi possível carregar o Intake.')
      if (!user) throw new Error('Não foi possível identificar o usuário atual.')
      if (!closureReason) throw new Error('Selecione um motivo para encerrar o Intake.')

      const response = await intakeService.closeIntakeWithoutContract(intake.id, {
        expectedVersion: intake.version,
        closureReason,
        closureNotes: closureNotes.trim() || undefined,
        updatedBy: user.id,
      })

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: (updatedIntake) => {
      if (!intake) return
      setIsClosureDialogOpen(false)
      setClosureReason('')
      setClosureNotes('')
      queryClient.setQueryData<IntakeDetailsData>(
        ['intakes', 'detail', intake.id],
        (current) => (current ? { ...current, intake: updatedIntake } : current),
      )
    },
  })

  const transitionMutation = useMutation({
    mutationFn: async (status: Intake['status']) => {
      if (!intake) throw new Error('Não foi possível carregar o Intake.')
      if (!user) throw new Error('Não foi possível identificar o usuário atual.')

      const response = await intakeService.transitionIntakeStatus(intake.id, {
        expectedVersion: intake.version,
        status,
        updatedBy: user.id,
      })

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: (updatedIntake) => {
      if (!intake) return
      queryClient.setQueryData<IntakeDetailsData>(
        ['intakes', 'detail', intake.id],
        (current) => (current ? { ...current, intake: updatedIntake } : current),
      )
    },
  })

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
      isClosing: closeMutation.isPending,
      isTransitioning: transitionMutation.isPending,
      closeError: closeMutation.error,
      actionError: closeMutation.error ?? transitionMutation.error,
      responsibleName:
        intakeQuery.data.responsible?.professionalName ?? 'Atendente não identificado',
      onEditDialogOpenChange: setIsEditDialogOpen,
      onClosureDialogOpenChange: setIsClosureDialogOpen,
      onClosureReasonChange: setClosureReason,
      onClosureNotesChange: setClosureNotes,
      onConfirmClosure: () => closeMutation.mutate(),
      onStartFormalization: () => transitionMutation.mutate('in_formalization'),
      onConfirmContract: () => transitionMutation.mutate('contracted'),
    } satisfies IntakeDetailsContentController,
  }
}
