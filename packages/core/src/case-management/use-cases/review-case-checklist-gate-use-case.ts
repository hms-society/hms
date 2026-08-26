import type { UseCase } from '#shared/interfaces/use-case'

import type { LegalCase } from '../domain/entities'
import { CaseChecklistGateReviewError, LegalCaseNotFoundError } from '../domain/errors'
import {
  CaseChecklistGateDecision,
  LegalCaseStatus,
  type CaseChecklistGateDecision as CaseChecklistGateDecisionValue,
} from '../domain/structures'
import type { LegalCasesRepository } from '../interfaces'

type Request = {
  caseId: string
  decision: CaseChecklistGateDecisionValue
  decidedBy: string
  remarks?: string
}

export class ReviewCaseChecklistGateUseCase implements UseCase<Request, LegalCase> {
  constructor(private readonly legalCasesRepository: LegalCasesRepository) {}

  async execute(request: Request): Promise<LegalCase> {
    const legalCase = await this.legalCasesRepository.findById(request.caseId)

    if (!legalCase) {
      throw new LegalCaseNotFoundError()
    }

    const remarks = request.remarks?.trim() || undefined
    this.ensureRemarksWhenRequired(request.decision, remarks)
    const status = this.getStatusAfterDecision(request.decision)

    const reviewedCase = await this.legalCasesRepository.reviewChecklistGate({
      caseId: request.caseId,
      checklistGate: {
        decision: request.decision,
        decidedBy: request.decidedBy,
        remarks,
      },
      status,
    })

    if (!reviewedCase) {
      throw new LegalCaseNotFoundError()
    }

    return reviewedCase
  }

  private ensureRemarksWhenRequired(
    decision: CaseChecklistGateDecisionValue,
    remarks?: string,
  ) {
    if (decision === CaseChecklistGateDecision.ApprovedWithException && !remarks) {
      throw new CaseChecklistGateReviewError(
        'Informe as ressalvas para aprovar o checklist com exceção.',
      )
    }
  }

  private getStatusAfterDecision(decision: CaseChecklistGateDecisionValue) {
    if (
      decision === CaseChecklistGateDecision.Approved ||
      decision === CaseChecklistGateDecision.ApprovedWithException
    ) {
      return LegalCaseStatus.ReadyForLegalProduction
    }

    return LegalCaseStatus.Documentation
  }
}
