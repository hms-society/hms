import { useQuery } from '@tanstack/react-query'
import type { AuditLogsListRequest } from '@hms/core/shared/interfaces'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const AUDIT_LOGS_QUERY_KEY = ['audit-logs'] as const

export function useAuditLogsQuery(request: AuditLogsListRequest) {
  const { auditLogsService } = useRestContext()
  const {
    data: auditLogsResponse,
    error: auditLogsError,
    isLoading: isLoadingAuditLogs,
    refetch,
  } = useQuery({
    queryKey: [...AUDIT_LOGS_QUERY_KEY, request],
    queryFn: async function fetchAuditLogs() {
      const response = await auditLogsService.list(request)
      if (response.isFailure) response.throwError()
      return response.body
    },
  })

  return {
    auditLogs: auditLogsResponse?.data ?? [],
    totalAuditLogs: auditLogsResponse?.total ?? 0,
    auditLogsError,
    isLoadingAuditLogs,
    refetch,
  }
}
