import type { LegalCase, LegalCaseSummary } from '../domain/entities'
import type { CaseChecklistGateDecision } from '../domain/structures'
import type { RestResponse } from '#shared/responses/rest-response'

export type ReviewCaseChecklistGateRequest = {
  decision: CaseChecklistGateDecision
  remarks?: string
}

export interface CaseManagementService {
  completeChecklist(caseId: string): Promise<RestResponse<LegalCase>>
  listMyCases(): Promise<RestResponse<readonly LegalCaseSummary[]>>
  reviewChecklistGate(
    caseId: string,
    request: ReviewCaseChecklistGateRequest,
  ): Promise<RestResponse<LegalCase>>
}
