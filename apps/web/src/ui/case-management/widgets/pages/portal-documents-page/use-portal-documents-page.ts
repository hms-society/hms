import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function usePortalDocumentsPage(caseId: string, portalToken: string) {
  const { caseManagementService } = useRestContext()

  const checklistQuery = useQuery({
    queryKey: ['portal-pending-checklist', caseId, portalToken],
    enabled: Boolean(caseId && portalToken),
    queryFn: async () => {
      const response = await caseManagementService.listPortalPendingChecklist(
        caseId,
        portalToken,
      )

      if (response.isFailure) response.throwError()
      return response.body
    },
  })

  const checklist = checklistQuery.data ?? []

  return {
    checklist,
    pendingItems: checklist.filter((item) => item.status === 'pending'),
    inAnalysisItems: checklist.filter((item) => item.status === 'in_analysis'),
    isLoading: checklistQuery.isLoading,
    isFetching: checklistQuery.isFetching,
    error: checklistQuery.error,
    refetch: checklistQuery.refetch,
  }
}
