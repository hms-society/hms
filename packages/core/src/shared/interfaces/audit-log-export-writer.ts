import type { AuditEventJsonValue } from '../domain/structures'

export type AuditLogExportRecord = {
  actorId: string
  actorProfile: string
  format: 'csv' | 'json'
  filters: AuditEventJsonValue
  exportedCount: number
}

export interface AuditLogExportWriter {
  recordExport(record: AuditLogExportRecord): Promise<void>
}
