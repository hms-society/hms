import type {
  AuditEventEntityType,
  AuditEventJsonValue,
  AuditEventOrigin,
  AuditEventStatus,
} from '../domain/structures'

export type AuditEventCreation = {
  occurredAt: Date
  actorId?: string
  actorProfile?: string
  entityType: AuditEventEntityType
  entityId?: string
  action: string
  origin: AuditEventOrigin
  status: AuditEventStatus
  beforeData?: AuditEventJsonValue
  afterData?: AuditEventJsonValue
  metadata?: AuditEventJsonValue
  justification?: string
}

export interface AuditEventWriter {
  add(event: AuditEventCreation): Promise<void>
}
