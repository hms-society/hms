import type {
  AuditLogsListRequest,
  AuditLogsService as AuditLogsRestService,
} from '@hms/core/shared/interfaces'
import type { AuditEvent } from '@hms/core/shared/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'

export const AuditLogsService = (restClient: RestClient): AuditLogsRestService => {
  return {
    list(request: AuditLogsListRequest) {
      const params = new URLSearchParams({
        page: String(request.page),
        limit: String(request.limit),
      })
      if (request.from) params.set('from', request.from)
      if (request.to) params.set('to', request.to)
      if (request.entityType) params.set('entityType', request.entityType)
      if (request.actorId) params.set('actorId', request.actorId)
      if (request.action) params.set('action', request.action)
      if (request.origin) params.set('origin', request.origin)
      if (request.status) params.set('status', request.status)

      return restClient.get<{
        data: readonly AuditEvent[]
        total: number
        page: number
        limit: number
      }>(`/audit-logs?${params.toString()}`)
    },

    getDetails(auditLogId: string) {
      return restClient.get<AuditEvent>(`/audit-logs/${auditLogId}`)
    },

    export(request: AuditLogsListRequest & { format: 'csv' | 'json' }) {
      const params = new URLSearchParams({
        format: request.format,
      })
      if (request.from) params.set('from', request.from)
      if (request.to) params.set('to', request.to)
      if (request.entityType) params.set('entityType', request.entityType)
      if (request.actorId) params.set('actorId', request.actorId)
      if (request.action) params.set('action', request.action)
      if (request.origin) params.set('origin', request.origin)
      if (request.status) params.set('status', request.status)

      return restClient.getFile(`/audit-logs/export?${params.toString()}`)
    },
  }
}
