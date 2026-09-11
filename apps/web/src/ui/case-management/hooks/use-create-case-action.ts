import type { CreateCaseData } from '@hms/validation/case-management'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useCreateCaseAction() {
  const { caseManagementService } = useRestContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCaseData) => {
      const response = await caseManagementService.createLegalCase(data)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases', 'my'] })
    },
  })
}
