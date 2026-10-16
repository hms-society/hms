import type { CaseHistoryCategory } from './case-history-category'
export type CaseHistoryCursorEnvelope = {
  caseId: string
  category?: CaseHistoryCategory
  search: string
  before: { occurredAt: string; id: string }
}
