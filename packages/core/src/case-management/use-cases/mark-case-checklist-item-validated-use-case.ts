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

    return this.finishValidation(checklistItem, request.validatedBy)
  }

  async executeByDocumentFileId(request: Omit<Request, 'checklistItemId'>) {
    const checklistItem =
      await this.caseChecklistItemsRepository.findByDocumentFileId(
        request.documentFileId,
      )

    if (!checklistItem) {
      throw new LegalCaseNotFoundError()
    }

    const updatedItem =
      await this.caseChecklistItemsRepository.markAsValidatedByDocument({
        checklistItemId: checklistItem.id,
        documentFileId: request.documentFileId,
        validatedBy: request.validatedBy,
      })

    return this.finishValidation(updatedItem, request.validatedBy)
  }

  private async finishValidation(
    checklistItem: CaseChecklistItem | undefined,
    validatedBy: string,
  ) {
    if (!checklistItem) throw new LegalCaseNotFoundError()

    const hasPendingRequiredItems =
      await this.caseChecklistItemsRepository.hasPendingRequiredItems(
        checklistItem.caseId,
      )

    if (!hasPendingRequiredItems) {
      await this.legalCasesRepository.completeChecklist(
        checklistItem.caseId,
        validatedBy,
      )
    }

    return checklistItem
  }
}
