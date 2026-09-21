import { Inject, Injectable } from '@nestjs/common'
import type {
  CaseChecklistItemsRepository,
  LegalCasesRepository,
  PendingsRepository,
} from '@hms/core/case-management/interfaces'
import { CreatePendingUseCase, MarkCaseChecklistItemValidatedUseCase } from '@hms/core/case-management/use-cases'
import type {
  CaseChecklistUpdateProvider as CaseChecklistUpdateProviderContract,
  LinkValidatedDocumentToChecklistRequest,
} from '@hms/core/document-engine/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'

@Injectable()
export class CaseChecklistUpdateProvider implements CaseChecklistUpdateProviderContract {
  private readonly useCase: MarkCaseChecklistItemValidatedUseCase
  private readonly createPendingUseCase: CreatePendingUseCase
  private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository
  private readonly legalCasesRepository: LegalCasesRepository

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    caseChecklistItemsRepository: CaseChecklistItemsRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.pendings)
    pendingsRepository: PendingsRepository,
  ) {
    this.caseChecklistItemsRepository = caseChecklistItemsRepository
    this.legalCasesRepository = legalCasesRepository
    this.useCase = new MarkCaseChecklistItemValidatedUseCase(
      caseChecklistItemsRepository,
      legalCasesRepository,
    )
    this.createPendingUseCase = new CreatePendingUseCase(pendingsRepository)
  }

  async linkValidatedDocumentToChecklist(
    request: LinkValidatedDocumentToChecklistRequest,
  ): Promise<void> {
    const legalCase = await this.legalCasesRepository.findById(request.caseId)

    if (!legalCase || legalCase.clientId !== request.clientId) {
      throw new AppError(
        'O caso selecionado não pertence ao cliente do lote documental.',
        'Caso incompatível com o documento',
      )
    }

    await this.useCase.execute(request)
  }

  async linkPendingDocumentToChecklist(request: {
    checklistItemId: string
    documentFileId: string
    documentFileName: string
  }): Promise<void> {
    await this.caseChecklistItemsRepository.linkPendingDocument(request)
  }

  async createDocumentPending(request: Parameters<CaseChecklistUpdateProviderContract['createDocumentPending']>[0]) {
    await this.createPendingUseCase.execute(request)
  }
}
