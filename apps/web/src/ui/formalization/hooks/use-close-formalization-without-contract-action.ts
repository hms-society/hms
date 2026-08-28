import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getFormalizationQueryKey } from './use-formalization-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type CloseFormalizationWithoutContractInput = {
  expectedIntakeVersion: number
  expectedVersion: number
  notes?: string
  reason: Parameters<
    ReturnType<typeof useRestContext>['formalizationService']['closeWithoutContract']
  >[1]['reason']
}

export const useCloseFormalizationWithoutContractAction = (formalizationId: string) => {
  const { formalizationService } = useRestContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CloseFormalizationWithoutContractInput) => {
      const response = await formalizationService.closeWithoutContract(
        formalizationId,
        input,
      )

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: () => {
      void queryClient
        .invalidateQueries({ queryKey: getFormalizationQueryKey(formalizationId) })
        .catch(() => undefined)
    },
  })
}
