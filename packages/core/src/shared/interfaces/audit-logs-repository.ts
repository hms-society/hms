import type {
  AuditEvent,
  AuditEventEntityType,
  AuditEventOrigin,
  AuditEventStatus,
} from '../domain/structures'

export type ListAuditLogsQuery = {
  readonly page: number
  readonly limit: number
  readonly from?: Date
  readonly to?: Date
  readonly entityType?: AuditEventEntityType
  readonly actorId?: string
  readonly action?: string
  readonly origin?: AuditEventOrigin
  readonly status?: AuditEventStatus
}

export type PaginatedAuditEvents = {
  readonly data: readonly AuditEvent[]
  readonly total: number
}

export interface AuditLogsRepository {
  list(query: ListAuditLogsQuery): Promise<PaginatedAuditEvents>
  findById(id: string): Promise<AuditEvent | undefined>
}
