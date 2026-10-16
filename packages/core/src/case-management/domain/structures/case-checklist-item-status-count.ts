import type { CaseChecklistItemStatus } from './case-checklist-item-status'

export type CaseChecklistItemStatusCount = {
  caseId: string
  isRequired: boolean
  status: CaseChecklistItemStatus
  count: number
}
