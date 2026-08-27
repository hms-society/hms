import type { UseCase } from '#shared/interfaces/use-case'

import type { LegalCase } from '../domain/entities'
import { CaseChecklistGateReviewError, LegalCaseNotFoundError } from '../domain/errors'
import { LegalCaseStatus } from '../domain/structures'
import type { LegalCasesRepository } from '../interfaces'

type Request = {
  caseId: string
  completedBy: string
}

export class CompleteCaseChecklistUseCase implements UseCase<Request, LegalCase> {
  constructor(private readonly legalCasesRepository: LegalCasesRepository) {}

  async execute(request: Request): Promise<LegalCase> {
    const legalCase = await this.legalCasesRepository.findById(request.caseId)

    if (!legalCase) {
      throw new LegalCaseNotFoundError()
    }

    const assignedCases = await this.legalCasesRepository.listByTeamMember(
      request.completedBy,
    )
    const canCompleteChecklist = assignedCases.some(
      (assignedCase) => assignedCase.id === request.caseId,
    )

    if (!canCompleteChecklist) {
      throw new LegalCaseNotFoundError()
    }

    if (legalCase.status !== LegalCaseStatus.Documentation) {
      throw new CaseChecklistGateReviewError(
        'Conclua o checklist apenas enquanto o caso estiver em documentação.',
      )
    }

    if (legalCase.checklistGate.decision) {
      throw new CaseChecklistGateReviewError('O checklist deste caso já foi revisado.')
    }

    if (legalCase.checklistCompletedAt) return legalCase

    const completedCase = await this.legalCasesRepository.completeChecklist(
      request.caseId,
      request.completedBy,
    )

    if (!completedCase) {
      throw new CaseChecklistGateReviewError(
        'O checklist deste caso não pode mais ser concluído.',
      )
    }

    return completedCase
  }
}
