import type { RestResponse } from '#shared/responses/rest-response.ts'

import type {
  AuditEvent,
  AuditEventEntityType,
  AuditEventOrigin,
  AuditEventStatus,
} from '../domain/structures'

export type AuditLogsListRequest = {
  page: number
  limit: number
  from?: string
  to?: string
  entityType?: AuditEventEntityType
  actorId?: string
  action?: string
  origin?: AuditEventOrigin
  status?: AuditEventStatus
}

export type AuditLogsListResponse = {
  data: readonly AuditEvent[]
  total: number
  page: number
  limit: number
}

export interface AuditLogsService {
  list(request: AuditLogsListRequest): Promise<RestResponse<AuditLogsListResponse>>
  getDetails(auditLogId: string): Promise<RestResponse<AuditEvent>>
  export(
    request: AuditLogsListRequest & { format: 'csv' | 'json' },
  ): Promise<RestResponse<Blob>>
}
