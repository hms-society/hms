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

    const assignedCases = await this.legalCasesRepository.listByTeamMember(
      request.decidedBy,
    )
    const canReviewCase = assignedCases.some(
      (assignedCase) => assignedCase.id === request.caseId,
    )

    if (!canReviewCase) {
      throw new LegalCaseNotFoundError()
    }

    this.ensureCaseCanBeReviewed(legalCase)

    const remarks = request.remarks?.trim() || undefined
    this.ensureRemarksWhenRequired(request.decision, remarks)
    this.ensureChecklistIsCompleteWhenApproving(legalCase, request.decision)
    const status = this.getStatusAfterDecision(request.decision)

    const reviewedCase = await this.legalCasesRepository.reviewChecklistGate({
      caseId: request.caseId,
      checklistGate: {
        decision: request.decision,
        decidedBy: request.decidedBy,
        remarks,
      },
      expectedStatus: LegalCaseStatus.Documentation,
      status,
    })

    if (!reviewedCase) {
      throw new CaseChecklistGateReviewError(
        'O checklist deste caso não pode mais ser revisado.',
      )
    }

    return reviewedCase
  }

  private ensureCaseCanBeReviewed(legalCase: LegalCase) {
    if (legalCase.status !== LegalCaseStatus.Documentation) {
      throw new CaseChecklistGateReviewError(
        'Revise o checklist apenas enquanto o caso estiver em documentação.',
      )
    }

    if (legalCase.checklistGate.decision) {
      throw new CaseChecklistGateReviewError('O checklist deste caso já foi revisado.')
    }
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

    if (decision === CaseChecklistGateDecision.BlockedInsufficient && !remarks) {
      throw new CaseChecklistGateReviewError(
        'Informe o motivo para bloquear o checklist.',
      )
    }

    if (decision === CaseChecklistGateDecision.RejectedOnMerit && !remarks) {
      throw new CaseChecklistGateReviewError(
        'Informe o motivo para reprovar o checklist.',
      )
    }
  }

  private ensureChecklistIsCompleteWhenApproving(
    legalCase: LegalCase,
    decision: CaseChecklistGateDecisionValue,
  ) {
    if (decision !== CaseChecklistGateDecision.Approved) return

    if (!legalCase.checklistCompletedAt) {
      throw new CaseChecklistGateReviewError(
        'Valide todos os itens obrigatórios do checklist antes da aprovação.',
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
