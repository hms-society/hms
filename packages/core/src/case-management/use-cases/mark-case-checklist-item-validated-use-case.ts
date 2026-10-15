import type { UseCase } from '#shared/interfaces/use-case'

import type { CaseChecklistItem } from '../domain/entities'
import { LegalCaseNotFoundError } from '../domain/errors'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../interfaces'
import type { CaseAccessProvider } from '../interfaces'
import { CaseAccessIntent } from '../domain/structures'

type Request = {
  caseId: string
  checklistItemId: string
  documentFileId: string
  documentFileName: string
  actorId: string
  validatedBy: string
}

export class MarkCaseChecklistItemValidatedUseCase
  implements UseCase<Request, CaseChecklistItem>
{
  constructor(
    private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository,
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute(request: Request): Promise<CaseChecklistItem> {
    await this.caseAccessProvider.authorize({ caseId: request.caseId, actorId: request.actorId, intent: CaseAccessIntent.WriteContent })
    const checklistItem =
      await this.caseChecklistItemsRepository.markAsValidatedByDocument({
        caseId: request.caseId,
        checklistItemId: request.checklistItemId,
        documentFileId: request.documentFileId,
        documentFileName: request.documentFileName,
        validatedBy: request.validatedBy,
      })

    return this.finishValidation(checklistItem, request.validatedBy)
  }

  async executeByDocumentFileId(request: Omit<Request, 'caseId' | 'checklistItemId'>) {
    const owner = await this.caseChecklistItemsRepository.findByDocumentFileId(request.documentFileId)
    if (!owner) throw new LegalCaseNotFoundError()
    await this.caseAccessProvider.authorize({ caseId: owner.caseId, actorId: request.actorId, intent: CaseAccessIntent.WriteContent })
    const checklistItem = await this.caseChecklistItemsRepository.findByDocumentFileId(
      request.documentFileId,
    )

    if (!checklistItem) {
      throw new LegalCaseNotFoundError()
    }

    const updatedItem = await this.caseChecklistItemsRepository.markAsValidatedByDocument(
      {
        caseId: checklistItem.caseId,
        checklistItemId: checklistItem.id,
        documentFileId: request.documentFileId,
        documentFileName: request.documentFileName,
        validatedBy: request.validatedBy,
      },
    )

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
      await this.legalCasesRepository.completeChecklist(checklistItem.caseId, validatedBy)
    }

    return checklistItem
  }
}
