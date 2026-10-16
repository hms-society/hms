import { useQuery, useQueryClient } from '@tanstack/react-query'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function usePersistedChecklistQuery(
  caseId: string,
  actorId: string | undefined,
  enabled = true,
) {
  const { caseManagementService } = useRestContext()
  const queryClient = useQueryClient()
  const queryKey = ['case-management', 'cases', caseId, 'checklist', actorId] as const
  const {
    data: persistedChecklistItems = [],
    error: persistedChecklistError,
    isLoading: isLoadingPersistedChecklist,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await caseManagementService.listCaseChecklist(caseId)
      if (response.isFailure && response.statusCode === HTTP_STATUS_CODE.forbidden) {
        queryClient.setQueryData(queryKey, [])
      }
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: enabled && Boolean(caseId),
    retry: false,
  })

  return { persistedChecklistItems, persistedChecklistError, isLoadingPersistedChecklist }
}
