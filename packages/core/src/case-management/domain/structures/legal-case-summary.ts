import type { LegalCaseStatus } from './legal-case-status'

export type LegalCaseSummary = {
  readonly caseId: string
  readonly intakeId: string
  readonly publicCode: string
  readonly status: LegalCaseStatus
  readonly legalAreaId: string
  readonly primaryLawyerId?: string
  readonly openedAt: Date
}
