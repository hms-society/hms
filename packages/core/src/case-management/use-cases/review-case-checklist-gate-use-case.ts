import type { UseCase } from '#shared/interfaces/use-case'

import type { LegalCase } from '../domain/entities'
import { CaseChecklistGateReviewError, LegalCaseNotFoundError } from '../domain/errors'
import {
  CaseChecklistGateDecision,
  LegalCaseLifecycleStatus,
  LegalCaseStatus,
  type CaseChecklistGateDecision as CaseChecklistGateDecisionValue,
} from '../domain/structures'
import type { LegalCasesRepository } from '../interfaces'
import type { CaseChecklistItemsRepository } from '../interfaces'
import type { CaseAccessProvider } from '../interfaces'
import { CaseAccessIntent } from '../domain/structures'

type Request = {
  caseId: string
  decision: CaseChecklistGateDecisionValue
  decidedBy: string
  remarks?: string
}

export class ReviewCaseChecklistGateUseCase implements UseCase<Request, LegalCase> {
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly checklistItemsRepository: CaseChecklistItemsRepository,
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute(request: Request): Promise<LegalCase> {
    const legalCase = await this.legalCasesRepository.findById(request.caseId)

    if (!legalCase) {
      throw new LegalCaseNotFoundError()
    }
    await this.caseAccessProvider.authorize({
      caseId: request.caseId,
      actorId: request.decidedBy,
      intent: CaseAccessIntent.ManageChecklistGate,
    })

    this.ensureCaseCanBeReviewed(legalCase)

    const remarks = request.remarks?.trim() || undefined
    this.ensureRemarksWhenRequired(request.decision, remarks)
    await this.ensureChecklistIsCompleteWhenApproving(request.decision, request.caseId)
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
    const workflowStage = legalCase.workflowStage
    if (
      legalCase.lifecycleStatus === LegalCaseLifecycleStatus.Closed ||
      workflowStage !== LegalCaseStatus.Documentation
    ) {
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

  private async ensureChecklistIsCompleteWhenApproving(
    decision: CaseChecklistGateDecisionValue,
    caseId: string,
  ) {
    if (decision !== CaseChecklistGateDecision.Approved) return
    const items = await this.checklistItemsRepository.listByCaseId(caseId)
    const requiredItems = items.filter((item) => item.isRequired)
    if (
      requiredItems.length === 0 ||
      requiredItems.some(
        (item) => item.status !== 'validated' && item.status !== 'waived',
      )
    ) {
      throw new CaseChecklistGateReviewError(
        'A aprovação integral exige checklist obrigatório instanciado e todos os documentos obrigatórios atendidos por validação ou dispensa.',
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
