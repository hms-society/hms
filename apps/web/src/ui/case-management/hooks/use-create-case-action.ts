import type { CaseManagementService as ICaseManagementService } from '@hms/core/case-management/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

type CreateLegalCaseRequest = Parameters<ICaseManagementService['createLegalCase']>[0]

export const useCreateCaseAction = () => {
  const queryClient = useQueryClient()
  const { caseManagementService } = useRestContext()

  async function createCase(request: CreateLegalCaseRequest) {
    const response = await caseManagementService.createLegalCase(request)

    if (response.isFailure) response.throwError()

    return response.body
  }

  function invalidateMyCases() {
    void queryClient.invalidateQueries({
      queryKey: ['case-management', 'my-cases'],
    })
  }

  const {
    mutateAsync: createCaseMutation,
    isPending: isCreatingCase,
    error: createCaseError,
    reset: resetCreateCase,
  } = useMutation({
    mutationFn: createCase,
    onSuccess: invalidateMyCases,
  })

  return {
    createCase: createCaseMutation,
    createCaseError,
    isCreatingCase,
    resetCreateCase,
  }
}
