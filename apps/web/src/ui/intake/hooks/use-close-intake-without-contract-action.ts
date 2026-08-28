import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Intake } from '@hms/core/intake/domain/entities'
import type { IntakeClosureReason } from '@hms/core/intake/domain/structures'
import { AppError } from '@hms/core/shared/domain/errors'

import type { IntakeDetailsData } from './use-intake-details-query'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type CloseIntakeWithoutContractInput = {
  closureNotes?: string
  closureReason: IntakeClosureReason
  expectedVersion: number
}

export const useCloseIntakeWithoutContractAction = (intakeId?: string) => {
  const { intakeService } = useRestContext()
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const {
    error: closeIntakeError,
    isPending: isClosingIntake,
    mutateAsync,
  } = useMutation({
    mutationFn: async (input: CloseIntakeWithoutContractInput) => {
      if (!intakeId) throw new AppError('Não foi possível carregar o Intake.')
      if (!user) throw new AppError('Não foi possível identificar o usuário atual.')

      const response = await intakeService.closeIntakeWithoutContract(intakeId, {
        ...input,
        updatedBy: user.id,
      })

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: (updatedIntake: Intake) => {
      if (!intakeId) return

      queryClient.setQueryData<IntakeDetailsData>(
        ['intakes', 'detail', intakeId],
        (current) => (current ? { ...current, intake: updatedIntake } : current),
      )
    },
  })

  return {
    closeIntakeError,
    isClosingIntake,
    closeIntakeWithoutContract: mutateAsync,
  }
}
