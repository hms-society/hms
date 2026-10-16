import type { DocumentValidationLogsRepository } from '../interfaces'
import type { DocumentValidationsRepository } from '../interfaces'
import type { CaseAccessProvider } from '../../case-management/interfaces/case-access-provider'
import { CaseAccessIntent } from '../../case-management/domain/structures/case-access-intent'
import { DocumentFileNotFoundError } from '../domain/errors'
import type { ListDocumentValidationLogsRequest } from '../domain/structures'

export type { ListDocumentValidationLogsRequest } from '../domain/structures'

export class ListDocumentValidationLogsUseCase {
  constructor(
    private readonly documentValidationLogsRepository: DocumentValidationLogsRepository,
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute(request: ListDocumentValidationLogsRequest) {
    const document = await this.documentValidationsRepository.findByFileId(
      request.documentFileId,
    )
    if (!document) throw new DocumentFileNotFoundError()
    const caseId = document.checklistLink?.caseId
    if (caseId) {
      await this.caseAccessProvider.authorize({
        caseId,
        actorId: request.actorId,
        intent: CaseAccessIntent.ReadDocument,
      })
    }

    return this.documentValidationLogsRepository.listByDocumentFileId(
      request.documentFileId,
    )
  }
}
