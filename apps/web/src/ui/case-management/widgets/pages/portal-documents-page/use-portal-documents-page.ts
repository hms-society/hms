import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function usePortalDocumentsPage(caseId: string, portalToken: string) {
  const { caseManagementService } = useRestContext()

  const portalCaseQuery = useQuery({
    queryKey: ['third-party-portal-case', caseId, portalToken],
    enabled: Boolean(caseId && portalToken),
    queryFn: async () => {
      const response = await caseManagementService.getThirdPartyPortalCase(
        caseId,
        portalToken,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
  })

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
    portalCase: portalCaseQuery.data,
    pendingItems: checklist.filter((item) => item.status === 'pending'),
    inAnalysisItems: checklist.filter((item) => item.status === 'in_analysis'),
    validatedItems: checklist.filter((item) => item.status === 'validated'),
    isLoading: checklistQuery.isLoading || portalCaseQuery.isLoading,
    isFetching: checklistQuery.isFetching || portalCaseQuery.isFetching,
    error: checklistQuery.error ?? portalCaseQuery.error,
    refetch: async () => {
      await Promise.all([checklistQuery.refetch(), portalCaseQuery.refetch()])
    },
  }
}
