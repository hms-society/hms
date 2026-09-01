import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const legalCaseStatusModel = pgEnum('legal_case_status', [
  LegalCaseStatus.Documentation,
  LegalCaseStatus.ReadyForLegalProduction,
  LegalCaseStatus.LegalProduction,
  LegalCaseStatus.ProtocolDelivery,
  LegalCaseStatus.Execution,
  LegalCaseStatus.Closed,
])
