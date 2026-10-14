import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminCasesQuery } from '@hms/core/case-management/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useAdminCasesQuery(query: AdminCasesQuery) {
  const { caseManagementService } = useRestContext()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [
      'case-management',
      'admin-cases',
      query.search ?? '',
      query.page,
      query.pageSize,
    ],
    queryFn: async () => {
      const response = await caseManagementService.listAllCasesForAdmin(query)
      if (response.isFailure) {
        if (response.statusCode === 403) {
          void queryClient.removeQueries({ queryKey: ['case-management', 'admin-cases'] })
        }
        response.throwError()
      }
      return response.body
    },
    retry: false,
  })
}
