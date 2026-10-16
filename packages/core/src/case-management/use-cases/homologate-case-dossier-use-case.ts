import type { UseCase } from '#shared/interfaces/use-case'

import type { LegalCase } from '../domain/entities'
import { CaseChecklistGateReviewError, LegalCaseNotFoundError } from '../domain/errors'
import {
  CaseAccessIntent,
  CaseChecklistGateDecision,
  CaseChecklistItemStatus,
  LegalCaseLifecycleStatus,
  LegalCaseStatus,
} from '../domain/structures'
import type {
  CaseAccessProvider,
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '../interfaces'

type Request = {
  caseId: string
  homologatedBy: string
}

export class HomologateCaseDossierUseCase implements UseCase<Request, LegalCase> {
  constructor(
    private readonly legalCases: LegalCasesRepository,
    private readonly checklistItems: CaseChecklistItemsRepository,
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute({ caseId, homologatedBy }: Request): Promise<LegalCase> {
    const legalCase = await this.legalCases.findById(caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()

    await this.caseAccessProvider.authorize({
      caseId,
      actorId: homologatedBy,
      intent: CaseAccessIntent.ManageChecklistGate,
    })

    if (
      legalCase.checklistGate.decision !== CaseChecklistGateDecision.Approved &&
      legalCase.checklistGate.decision !== CaseChecklistGateDecision.ApprovedWithException
    ) {
      throw new CaseChecklistGateReviewError(
        'A homologação exige que o checklist tenha sido aprovado primeiro.',
      )
    }
    if (
      legalCase.lifecycleStatus === LegalCaseLifecycleStatus.Closed ||
      legalCase.workflowStage !== LegalCaseStatus.ReadyForLegalProduction
    ) {
      throw new CaseChecklistGateReviewError(
        'O dossiê só pode ser homologado após a aprovação do checklist.',
      )
    }
    if (legalCase.dossierGate.homologatedAt) {
      throw new CaseChecklistGateReviewError('O dossiê deste caso já foi homologado.')
    }

    const items = await this.checklistItems.listByCaseId(caseId)
    this.ensureRequiredItemsSatisfied(legalCase, items)

    const homologatedCase = await this.legalCases.homologateDossier({
      caseId,
      homologatedBy,
      expectedStatus: LegalCaseStatus.ReadyForLegalProduction,
      status: LegalCaseStatus.LegalProduction,
    })
    if (!homologatedCase) {
      throw new CaseChecklistGateReviewError(
        'O dossiê deste caso não pode mais ser homologado.',
      )
    }

    return homologatedCase
  }
  private ensureRequiredItemsSatisfied(
    legalCase: LegalCase,
    items: Awaited<ReturnType<CaseChecklistItemsRepository['listByCaseId']>>,
  ): void {
    const requiredItems = items.filter((item) => item.isRequired)
    const hasApprovedException =
      legalCase.checklistGate.decision === CaseChecklistGateDecision.ApprovedWithException
    const hasPendingRequiredItem =
      !hasApprovedException &&
      (requiredItems.length === 0 ||
        requiredItems.some(
          (item) =>
            item.status !== CaseChecklistItemStatus.Validated &&
            item.status !== CaseChecklistItemStatus.Waived,
        ))
    if (hasPendingRequiredItem) {
      throw new CaseChecklistGateReviewError(
        'O dossiê não pode ser homologado enquanto houver documentos obrigatórios pendentes de atendimento por validação ou dispensa.',
      )
    }
  }
}
