import type { UseCase } from '#shared/interfaces/use-case'

import type { CaseChecklistItem } from '../domain/entities'
import { LegalCaseNotFoundError } from '../domain/errors'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../interfaces'

type Request = {
  caseId: string
  collaboratorId: string
}

export class ListCaseChecklistUseCase
  implements UseCase<Request, readonly CaseChecklistItem[]>
{
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository,
  ) {}

  async execute(request: Request): Promise<readonly CaseChecklistItem[]> {
    const assignedCases = await this.legalCasesRepository.listByTeamMember(
      request.collaboratorId,
    )
    const canAccessChecklist = assignedCases.some(
      (assignedCase) => assignedCase.id === request.caseId,
    )

    if (!canAccessChecklist) {
      throw new LegalCaseNotFoundError()
    }

    return this.caseChecklistItemsRepository.listByCaseId(request.caseId)
  }
}
