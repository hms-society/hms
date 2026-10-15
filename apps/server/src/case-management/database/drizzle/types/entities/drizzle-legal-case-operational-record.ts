import type { InferSelectModel } from 'drizzle-orm'
import type { LegalCaseOperationalRecord } from '@hms/core/case-management/domain/entities'

import { legalCaseModel } from '@/case-management/database/drizzle/models'

export type DrizzleLegalCaseOperationalRecord = Pick<
  InferSelectModel<typeof legalCaseModel>,
  keyof Omit<LegalCaseOperationalRecord, 'managerCollaboratorIds'>
> & {
  readonly managerCollaboratorIds: readonly string[]
}
