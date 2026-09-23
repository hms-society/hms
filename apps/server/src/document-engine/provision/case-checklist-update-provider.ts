import { Inject, Injectable } from '@nestjs/common'
import type {
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import { MarkCaseChecklistItemValidatedUseCase } from '@hms/core/case-management/use-cases'
import type {
  CaseChecklistUpdateProvider as CaseChecklistUpdateProviderContract,
  LinkValidatedDocumentToChecklistRequest,
  MarkDocumentResendRequestedRequest,
} from '@hms/core/document-engine/interfaces'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'

@Injectable()
export class CaseChecklistUpdateProvider implements CaseChecklistUpdateProviderContract {
  private readonly useCase: MarkCaseChecklistItemValidatedUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
  ) {
    this.useCase = new MarkCaseChecklistItemValidatedUseCase(
      this.caseChecklistItemsRepository,
      legalCasesRepository,
    )
  }

  async linkValidatedDocumentToChecklist(
    request: LinkValidatedDocumentToChecklistRequest,
  ): Promise<void> {
    if (!request.checklistItemId) {
      await this.useCase.executeByDocumentFileId({
        documentFileId: request.documentFileId,
        validatedBy: request.validatedBy,
      })
      return
    }

    await this.useCase.execute(request as {
      checklistItemId: string
      documentFileId: string
      validatedBy: string
    })
  }

  async markDocumentResendRequested(
    request: MarkDocumentResendRequestedRequest,
  ): Promise<void> {
    const checklistItem = await this.caseChecklistItemsRepository.findByDocumentFileId(
      request.documentFileId,
    )

    if (!checklistItem) return

    await this.caseChecklistItemsRepository.linkPendingDocument({
      checklistItemId: checklistItem.id,
      documentFileId: request.documentFileId,
      documentFileName: checklistItem.documentFileName ?? 'Documento enviado',
    })
  }
}
