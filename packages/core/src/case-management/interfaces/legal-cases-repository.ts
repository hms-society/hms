import type { LegalCase, LegalCaseCreation, LegalCaseSummary, CaseMemberCreation } from '../domain/entities'
import type { CaseChecklistGate, LegalCaseStatus } from '../domain/structures'

export type ReviewChecklistGateRepositoryParams = {
  caseId: string
  checklistGate: Pick<CaseChecklistGate, 'decision' | 'decidedBy' | 'remarks'>
  expectedStatus: LegalCaseStatus
  status: LegalCaseStatus
}

export type CreateCaseWithTeamParams = {
  legalCase: Omit<LegalCaseCreation, 'publicCode'>
  team: Array<Omit<CaseMemberCreation, 'caseId'>>
}

export interface LegalCasesRepository {
  createCaseWithTeam(params: CreateCaseWithTeamParams): Promise<LegalCase>
  addMany(legalCases: readonly LegalCaseCreation[]): Promise<readonly LegalCase[]>
  completeChecklist(caseId: string, completedBy: string): Promise<LegalCase | undefined>
  findById(caseId: string): Promise<LegalCase | undefined>
  listByTeamMember(collaboratorId: string): Promise<readonly LegalCaseSummary[]>
  reviewChecklistGate(
    params: ReviewChecklistGateRepositoryParams,
  ): Promise<LegalCase | undefined>
  removeAll(): Promise<void>
}
