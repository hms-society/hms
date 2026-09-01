import type { UseCase } from '#shared/interfaces/use-case'

import type { CaseChecklistItem } from '../domain/entities'
import { LegalCaseNotFoundError } from '../domain/errors'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../interfaces'

type Request = {
  checklistItemId: string
  documentFileId: string
  validatedBy: string
}

export class MarkCaseChecklistItemValidatedUseCase
  implements UseCase<Request, CaseChecklistItem>
{
  constructor(
    private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository,
    private readonly legalCasesRepository: LegalCasesRepository,
  ) {}

  async execute(request: Request): Promise<CaseChecklistItem> {
    const checklistItem =
      await this.caseChecklistItemsRepository.markAsValidatedByDocument({
        checklistItemId: request.checklistItemId,
        documentFileId: request.documentFileId,
        validatedBy: request.validatedBy,
      })

    if (!checklistItem) {
      throw new LegalCaseNotFoundError()
    }

    const hasPendingRequiredItems =
      await this.caseChecklistItemsRepository.hasPendingRequiredItems(
        checklistItem.caseId,
      )

    if (!hasPendingRequiredItems) {
      await this.legalCasesRepository.completeChecklist(
        checklistItem.caseId,
        request.validatedBy,
      )
    }

    return checklistItem
  }
}
