import type { LegalCase, LegalCaseCreation, LegalCaseSummary } from '../domain/entities'
import type { CaseChecklistGate, LegalCaseStatus } from '../domain/structures'

export type ReviewChecklistGateRepositoryParams = {
  caseId: string
  checklistGate: Pick<CaseChecklistGate, 'decision' | 'decidedBy' | 'remarks'>
  status: LegalCaseStatus
}

export interface LegalCasesRepository {
  addMany(legalCases: readonly LegalCaseCreation[]): Promise<readonly LegalCase[]>
  findById(caseId: string): Promise<LegalCase | undefined>
  listByTeamMember(collaboratorId: string): Promise<readonly LegalCaseSummary[]>
  reviewChecklistGate(
    params: ReviewChecklistGateRepositoryParams,
  ): Promise<LegalCase | undefined>
  removeAll(): Promise<void>
}
