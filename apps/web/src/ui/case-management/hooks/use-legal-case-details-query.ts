import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useLegalCaseDetailsQuery(caseId: string) {
  const { caseManagementService } = useRestContext()

  return useQuery({
    queryKey: ['case-management', 'details', caseId],
    queryFn: async () => {
      const response = await caseManagementService.getLegalCaseDetails(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(caseId),
  })
}
