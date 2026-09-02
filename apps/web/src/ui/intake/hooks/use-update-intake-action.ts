import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Intake } from '@hms/core/intake/domain/entities'
import type { UpdateIntakeFormData } from '@hms/validation/intake'

import type { IntakeDetailsData } from './use-intake-details-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useUpdateIntakeAction = (intakeId: string) => {
  const { intakeService } = useRestContext()
  const queryClient = useQueryClient()
  const {
    error: updateIntakeError,
    isPending: isUpdatingIntake,
    mutateAsync,
  } = useMutation({
    mutationFn: async (values: UpdateIntakeFormData) => {
      const response = await intakeService.updateIntake(intakeId, values)

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: (updatedIntake: Intake) => {
      queryClient.setQueryData<IntakeDetailsData>(
        ['intakes', 'detail', intakeId],
        (current) => (current ? { ...current, intake: updatedIntake } : current),
      )
    },
  })

  return {
    isUpdatingIntake,
    updateIntakeError,
    updateIntake: mutateAsync,
  }
}
