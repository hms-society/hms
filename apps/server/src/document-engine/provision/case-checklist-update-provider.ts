import { Inject, Injectable } from '@nestjs/common'
import type {
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import { MarkCaseChecklistItemValidatedUseCase } from '@hms/core/case-management/use-cases'
import type {
  CaseChecklistUpdateProvider as CaseChecklistUpdateProviderContract,
  LinkValidatedDocumentToChecklistRequest,
} from '@hms/core/document-engine/interfaces'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'

@Injectable()
export class CaseChecklistUpdateProvider implements CaseChecklistUpdateProviderContract {
  private readonly useCase: MarkCaseChecklistItemValidatedUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    caseChecklistItemsRepository: CaseChecklistItemsRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
  ) {
    this.useCase = new MarkCaseChecklistItemValidatedUseCase(
      caseChecklistItemsRepository,
      legalCasesRepository,
    )
  }

  async linkValidatedDocumentToChecklist(
    request: LinkValidatedDocumentToChecklistRequest,
  ): Promise<void> {
    await this.useCase.execute(request)
  }
}
