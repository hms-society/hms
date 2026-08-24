import type { LegalCase } from '../domain/entities'
import type { CaseChecklistGateDecision } from '../domain/structures'
import type { RestResponse } from '#shared/responses/rest-response'

export type ReviewCaseChecklistGateRequest = {
  expectedVersion: number
  decision: CaseChecklistGateDecision
  decidedBy: string
  remarks?: string
}

export interface CaseManagementService {
  reviewChecklistGate(
    caseId: string,
    request: ReviewCaseChecklistGateRequest,
  ): Promise<RestResponse<LegalCase>>
}
