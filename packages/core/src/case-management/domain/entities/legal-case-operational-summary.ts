import type { LegalCaseStatus } from '../structures'

export type LegalCaseOperationalSummary = {
  readonly id: string
  readonly publicCode: string
  readonly title: string
  readonly clientName: string
  readonly legalArea: string
  readonly legalTopic: string
  readonly status: LegalCaseStatus
  readonly managerNames: readonly string[]
  readonly updatedAt: Date
}
