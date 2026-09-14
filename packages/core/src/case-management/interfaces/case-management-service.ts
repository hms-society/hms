import type { CaseChecklistItem, LegalCase, LegalCaseSummary } from '../domain/entities'
import type { CaseChecklistGateDecision } from '../domain/structures'
import type { RestResponse } from '#shared/responses/rest-response'
import type { LegalCaseSummary as LegalCaseCompletionSummary } from '../domain/structures'

export type ReviewCaseChecklistGateRequest = {
  decision: CaseChecklistGateDecision
  remarks?: string
}

export type AddCaseChecklistComplementaryItemRequest = {
  templateItemKey: string
  title: string
}

export type CreateLegalCaseRequest = {
  title: string
  intakeId: string
  legalAreaId: string
  legalTopicId: string
  team: Array<{
    collaboratorId: string
    role: string
    permission: string
  }>
}

export interface CaseManagementService {
  createLegalCase(request: CreateLegalCaseRequest): Promise<RestResponse<LegalCase>>
  addComplementaryChecklistItem(
    caseId: string,
    request: AddCaseChecklistComplementaryItemRequest,
  ): Promise<RestResponse<CaseChecklistItem>>
  listCaseChecklist(caseId: string): Promise<RestResponse<readonly CaseChecklistItem[]>>
  listMyCases(): Promise<RestResponse<readonly LegalCaseSummary[]>>
  getLegalCaseDetails(caseId: string): Promise<RestResponse<LegalCaseSummary>>
  reviewChecklistGate(
    caseId: string,
    request: ReviewCaseChecklistGateRequest,
  ): Promise<RestResponse<LegalCase>>
  getByIntakeId(
    intakeId: string,
  ): Promise<RestResponse<LegalCaseCompletionSummary | null>>
}
