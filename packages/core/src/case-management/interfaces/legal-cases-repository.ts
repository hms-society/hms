import type { LegalCase, LegalCaseCreation } from '../domain/entities'
import type { CaseChecklistGate, LegalCaseStatus } from '../domain/structures'

export type ReviewChecklistGateRepositoryParams = {
  caseId: string
  expectedVersion: number
  checklistGate: Pick<CaseChecklistGate, 'decision' | 'decidedBy' | 'remarks'>
  status: LegalCaseStatus
}

export interface LegalCasesRepository {
  addMany(legalCases: readonly LegalCaseCreation[]): Promise<readonly LegalCase[]>
  findById(caseId: string): Promise<LegalCase | undefined>
  reviewChecklistGate(
    params: ReviewChecklistGateRepositoryParams,
  ): Promise<LegalCase | undefined>
  removeAll(): Promise<void>
}
