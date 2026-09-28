import { Inject, Injectable } from '@nestjs/common'
import type {
  CaseChecklistItemsRepository,
  LegalCasesRepository,
  PendingsRepository,
} from '@hms/core/case-management/interfaces'
import {
  CreatePendingUseCase,
  MarkCaseChecklistItemValidatedUseCase,
} from '@hms/core/case-management/use-cases'
import type {
  CaseChecklistUpdateProvider as CaseChecklistUpdateProviderContract,
  LinkValidatedDocumentToChecklistRequest,
  MarkDocumentResendRequestedRequest,
} from '@hms/core/document-engine/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'

@Injectable()
export class CaseChecklistUpdateProvider implements CaseChecklistUpdateProviderContract {
  private readonly useCase: MarkCaseChecklistItemValidatedUseCase
  private readonly createPendingUseCase: CreatePendingUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    private readonly legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.pendings)
    pendingsRepository: PendingsRepository,
  ) {
    this.useCase = new MarkCaseChecklistItemValidatedUseCase(
      this.caseChecklistItemsRepository,
      this.legalCasesRepository,
    )
    this.createPendingUseCase = new CreatePendingUseCase(pendingsRepository)
  }

  async linkValidatedDocumentToChecklist(
    request: LinkValidatedDocumentToChecklistRequest,
  ): Promise<void> {
    if (!request.checklistItemId) {
      const checklistItem = await this.caseChecklistItemsRepository.findByDocumentFileId(
        request.documentFileId,
      )

      if (!checklistItem) return

      await this.useCase.executeByDocumentFileId({
        documentFileId: request.documentFileId,
        documentFileName: request.documentFileName ?? 'Documento enviado',
        validatedBy: request.validatedBy,
      })
      return
    }

    if (!request.caseId || !request.clientId) {
      throw new AppError(
        'Não foi possível identificar o cliente e o caso do item do checklist.',
        'Vínculo do checklist inválido',
      )
    }

    const legalCase = await this.legalCasesRepository.findById(request.caseId)

    if (!legalCase || legalCase.clientId !== request.clientId) {
      throw new AppError(
        'O caso selecionado não pertence ao cliente do lote documental.',
        'Caso incompatível com o documento',
      )
    }

    await this.useCase.execute({
      caseId: request.caseId,
      checklistItemId: request.checklistItemId,
      documentFileId: request.documentFileId,
      documentFileName: request.documentFileName ?? 'Documento enviado',
      validatedBy: request.validatedBy,
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

  async linkPendingDocumentToChecklist(request: {
    checklistItemId: string
    documentFileId: string
    documentFileName: string
  }): Promise<void> {
    await this.caseChecklistItemsRepository.linkPendingDocument(request)
  }

  async createDocumentPending(
    request: Parameters<CaseChecklistUpdateProviderContract['createDocumentPending']>[0],
  ) {
    await this.createPendingUseCase.execute(request)
  }
}
