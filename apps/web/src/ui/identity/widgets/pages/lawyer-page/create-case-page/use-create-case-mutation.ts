import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateCaseData } from '@hms/validation/case-management'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useCreateCaseMutation() {
  const { caseManagementService } = useRestContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCaseData) => {
      const response = await caseManagementService.createLegalCase(data)
      if (response.isFailure) {
        response.throwError()
      }
      return response.body
    },
    onSuccess: () => {
      // Invalidate the list of cases to ensure it refetches
      queryClient.invalidateQueries({ queryKey: ['cases', 'my'] })
    },
  })
}
