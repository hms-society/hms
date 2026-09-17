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

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'

@Injectable()
export class CaseChecklistUpdateProvider implements CaseChecklistUpdateProviderContract {
  private readonly useCase: MarkCaseChecklistItemValidatedUseCase
  private readonly createPendingUseCase: CreatePendingUseCase
  private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    caseChecklistItemsRepository: CaseChecklistItemsRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.pendings)
    pendingsRepository: PendingsRepository,
  ) {
    this.caseChecklistItemsRepository = caseChecklistItemsRepository
    this.useCase = new MarkCaseChecklistItemValidatedUseCase(
      caseChecklistItemsRepository,
      legalCasesRepository,
    )
    this.createPendingUseCase = new CreatePendingUseCase(pendingsRepository)
  }

  async linkValidatedDocumentToChecklist(
    request: LinkValidatedDocumentToChecklistRequest,
  ): Promise<void> {
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
