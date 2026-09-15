import type { Entity } from '#shared/domain/entities/entity'

import type { DynamicFormAdministrationAction } from '../structures/dynamic-form-administration-action'
import type { DynamicFormAuditDetails } from '../structures/dynamic-form-audit-details'

export type DynamicFormAdministrationAuditEntry = Entity & {
  dynamicFormId: string
  actorCollaboratorId: string
  action: DynamicFormAdministrationAction
  occurredAt: Date
  operationKey: string | null
  details: DynamicFormAuditDetails
}
