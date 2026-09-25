import type { UseCase } from '#shared/interfaces/use-case'

import type { LegalCase } from '../domain/entities'
import { CaseChecklistGateReviewError, LegalCaseNotFoundError } from '../domain/errors'
import {
  CaseChecklistGateDecision,
  CaseChecklistItemStatus,
  LegalCaseStatus,
} from '../domain/structures'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../interfaces'

type Request = {
  caseId: string
  homologatedBy: string
}

export class HomologateCaseDossierUseCase implements UseCase<Request, LegalCase> {
  constructor(
    private readonly legalCases: LegalCasesRepository,
    private readonly checklistItems: CaseChecklistItemsRepository,
  ) {}

  async execute({ caseId, homologatedBy }: Request): Promise<LegalCase> {
    const legalCase = await this.legalCases.findById(caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()

    const assignedCases = await this.legalCases.listByTeamMember(homologatedBy)
    if (!assignedCases.some((assignedCase) => assignedCase.id === caseId)) {
      throw new LegalCaseNotFoundError()
    }

    if (
      legalCase.checklistGate.decision !== CaseChecklistGateDecision.Approved &&
      legalCase.checklistGate.decision !== CaseChecklistGateDecision.ApprovedWithException
    ) {
      throw new CaseChecklistGateReviewError(
        'A homologação exige que o checklist tenha sido aprovado primeiro.',
      )
    }
    if (legalCase.status !== LegalCaseStatus.ReadyForLegalProduction) {
      throw new CaseChecklistGateReviewError(
        'O dossiê só pode ser homologado após a aprovação do checklist.',
      )
    }
    if (legalCase.dossierGate.homologatedAt) {
      throw new CaseChecklistGateReviewError('O dossiê deste caso já foi homologado.')
    }

    const items = await this.checklistItems.listByCaseId(caseId)
    const requiredItems = items.filter((item) => item.isRequired)
    const hasPendingRequiredItem =
      requiredItems.length === 0 ||
      requiredItems.some((item) => item.status !== CaseChecklistItemStatus.Validated)
    if (hasPendingRequiredItem) {
      throw new CaseChecklistGateReviewError(
        'O dossiê não pode ser homologado enquanto houver documentos obrigatórios pendentes de validação.',
      )
    }

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
}
