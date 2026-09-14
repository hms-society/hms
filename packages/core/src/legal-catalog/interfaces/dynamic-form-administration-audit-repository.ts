import type { DynamicFormAdministrationAuditEntry } from '../domain/entities/dynamic-form-administration-audit-entry'

export interface DynamicFormAdministrationAuditRepository {
  add(entry: DynamicFormAdministrationAuditEntry): Promise<void>
}
