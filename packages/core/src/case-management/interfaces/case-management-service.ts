import type { CaseChecklistItem, LegalCase, LegalCaseSummary } from '../domain/entities'
import type { CaseChecklistGateDecision } from '../domain/structures'
import type { RestResponse } from '#shared/responses/rest-response'

export type ReviewCaseChecklistGateRequest = {
  decision: CaseChecklistGateDecision
  remarks?: string
}

export type AddCaseChecklistComplementaryItemRequest = {
  templateItemKey: string
  title: string
}

export interface CaseManagementService {
  addComplementaryChecklistItem(
    caseId: string,
    request: AddCaseChecklistComplementaryItemRequest,
  ): Promise<RestResponse<CaseChecklistItem>>
  listCaseChecklist(caseId: string): Promise<RestResponse<readonly CaseChecklistItem[]>>
  listMyCases(): Promise<RestResponse<readonly LegalCaseSummary[]>>
  reviewChecklistGate(
    caseId: string,
    request: ReviewCaseChecklistGateRequest,
  ): Promise<RestResponse<LegalCase>>
}
