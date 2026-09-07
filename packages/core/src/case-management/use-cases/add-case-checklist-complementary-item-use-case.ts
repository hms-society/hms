import type { UseCase } from '#shared/interfaces/use-case'

import type { CaseChecklistItem } from '../domain/entities'
import { LegalCaseNotFoundError } from '../domain/errors'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../interfaces'

type Request = {
  caseId: string
  collaboratorId: string
  templateItemKey: string
  title: string
}

export class AddCaseChecklistComplementaryItemUseCase
  implements UseCase<Request, CaseChecklistItem>
{
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository,
  ) {}

  async execute(request: Request): Promise<CaseChecklistItem> {
    const assignedCases = await this.legalCasesRepository.listByTeamMember(
      request.collaboratorId,
    )
    const canAccessChecklist = assignedCases.some(
      (assignedCase) => assignedCase.id === request.caseId,
    )

    if (!canAccessChecklist) {
      throw new LegalCaseNotFoundError()
    }

    const [item] = await this.caseChecklistItemsRepository.addMany([
      {
        caseId: request.caseId,
        templateItemKey: request.templateItemKey,
        title: request.title,
        isRequired: false,
      },
    ])

    if (!item) {
      throw new LegalCaseNotFoundError()
    }

    return item
  }
}
