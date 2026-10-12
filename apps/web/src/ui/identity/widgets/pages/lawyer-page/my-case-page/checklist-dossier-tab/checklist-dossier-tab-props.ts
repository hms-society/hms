import type { LegalCaseSummary } from '@hms/core/case-management/domain/entities'
import type { ActivityItem, ChecklistItem } from '../types'

export type ChecklistDossierTabProps = {
  activities: ActivityItem[]
  caseId: string
  caseDetails?: LegalCaseSummary
  checklist: ChecklistItem[]
  isReviewDisabled?: boolean
  reviewDisabledReason?: string
  readOnly?: boolean
}
