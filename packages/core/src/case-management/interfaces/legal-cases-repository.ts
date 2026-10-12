import type { LegalCaseOperationalRecord } from '../domain/entities'
import type { LegalCaseOperationalRecordsQuery } from '../domain/structures'
import type { PaginationResponse } from '#shared/responses/pagination-response'
import type { LegalCase, LegalCaseCreation, CaseMemberCreation } from '../domain/entities'
import type { CaseChecklistGate, LegalCaseStatus } from '../domain/structures'

export type ReviewChecklistGateRepositoryParams = {
  caseId: string
  checklistGate: Pick<CaseChecklistGate, 'decision' | 'decidedBy' | 'remarks'>
  expectedStatus: LegalCaseStatus
  status: LegalCaseStatus
}

export type HomologateDossierRepositoryParams = {
  caseId: string
  homologatedBy: string
  expectedStatus: LegalCaseStatus
  status: LegalCaseStatus
}

export type CreateCaseWithTeamParams = {
  legalCase: Omit<LegalCaseCreation, 'publicCode'>
  team: Array<Omit<CaseMemberCreation, 'caseId'>>
}

export interface LegalCasesRepository {
  listOperationalRecords(
    query: LegalCaseOperationalRecordsQuery,
  ): Promise<PaginationResponse<LegalCaseOperationalRecord>>
  createCaseWithTeam(params: CreateCaseWithTeamParams): Promise<LegalCase>
  addMany(legalCases: readonly LegalCaseCreation[]): Promise<readonly LegalCase[]>
  completeChecklist(caseId: string, completedBy: string): Promise<LegalCase | undefined>
  findById(caseId: string): Promise<LegalCase | undefined>
  replaceTeamVersion(caseId: string, expectedTeamVersion: number): Promise<number>
  listByTeamMember(
    collaboratorId: string,
    clientId?: string,
  ): Promise<readonly LegalCase[]>
  reviewChecklistGate(
    params: ReviewChecklistGateRepositoryParams,
  ): Promise<LegalCase | undefined>
  homologateDossier(
    params: HomologateDossierRepositoryParams,
  ): Promise<LegalCase | undefined>
  removeAll(): Promise<void>
}
