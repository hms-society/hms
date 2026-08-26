import type { LegalCase, LegalCaseSummary } from '../domain/entities'
import type { CaseChecklistGateDecision } from '../domain/structures'
import type { RestResponse } from '#shared/responses/rest-response'

export type ReviewCaseChecklistGateRequest = {
  decision: CaseChecklistGateDecision
  decidedBy: string
  remarks?: string
}

export interface CaseManagementService {
  listMyCases(): Promise<RestResponse<readonly LegalCaseSummary[]>>
  reviewChecklistGate(
    caseId: string,
    request: ReviewCaseChecklistGateRequest,
  ): Promise<RestResponse<LegalCase>>
}
