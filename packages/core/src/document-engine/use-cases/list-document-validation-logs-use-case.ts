import type { DocumentValidationLogsRepository } from '../interfaces'

export type ListDocumentValidationLogsRequest = {
  documentFileId: string
}

export class ListDocumentValidationLogsUseCase {
  constructor(
    private readonly documentValidationLogsRepository: DocumentValidationLogsRepository,
  ) {}

  execute(request: ListDocumentValidationLogsRequest) {
    return this.documentValidationLogsRepository.listByDocumentFileId(
      request.documentFileId,
    )
  }
}
