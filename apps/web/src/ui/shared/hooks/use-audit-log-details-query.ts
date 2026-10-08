import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useAuditLogDetailsQuery(auditLogId: string | undefined) {
  const { auditLogsService } = useRestContext()
  const {
    data: auditLog,
    error: auditLogError,
    isLoading: isLoadingAuditLog,
  } = useQuery({
    queryKey: ['audit-log', auditLogId],
    enabled: Boolean(auditLogId),
    queryFn: async function fetchAuditLogDetails() {
      const response = await auditLogsService.getDetails(auditLogId as string)
      if (response.isFailure) response.throwError()
      return response.body
    },
  })

  return { auditLog, auditLogError, isLoadingAuditLog }
}
