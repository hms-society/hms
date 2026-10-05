export const AuditEventOrigin = {
  Human: 'human',
  System: 'system',
  Ai: 'ai',
  Integration: 'integration',
} as const

export type AuditEventOrigin = (typeof AuditEventOrigin)[keyof typeof AuditEventOrigin]

export const AuditEventStatus = {
  Success: 'success',
  Failure: 'failure',
} as const

export type AuditEventStatus = (typeof AuditEventStatus)[keyof typeof AuditEventStatus]

export type AuditEventEntityType =
  | 'intake'
  | 'case'
  | 'document'
  | 'piece'
  | 'checklist'
  | 'task'
  | 'deadline'
  | 'permission'
  | 'client'
  | 'third_party'
  | 'external_access'
  | 'document_validation'
  | 'document_exception'
  | 'audit_log_export'

export type AuditEventJsonValue =
  | string
  | number
  | boolean
  | null
  | AuditEventJsonValue[]
  | { readonly [key: string]: AuditEventJsonValue }

export type AuditEvent = {
  readonly id: string
  readonly occurredAt: Date
  readonly actorId?: string
  readonly actorProfile?: string
  readonly entityType: AuditEventEntityType
  readonly entityId?: string
  readonly action: string
  readonly origin?: AuditEventOrigin
  readonly status?: AuditEventStatus
  readonly beforeData?: AuditEventJsonValue
  readonly afterData?: AuditEventJsonValue
  readonly justification?: string
  readonly ipAddress?: string
  readonly metadata?: AuditEventJsonValue
}
