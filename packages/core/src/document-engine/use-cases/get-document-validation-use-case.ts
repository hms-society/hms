import type { DocumentValidationsRepository } from '../interfaces'
import { DocumentFileNotFoundError } from '../domain/errors'

export type GetDocumentValidationRequest = {
  documentFileId: string
}

export class GetDocumentValidationUseCase {
  constructor(
    private readonly documentValidationsRepository: DocumentValidationsRepository,
  ) {}

  async execute(request: GetDocumentValidationRequest) {
    const document = await this.documentValidationsRepository.findByFileId(
      request.documentFileId,
    )

    if (!document) {
      throw new DocumentFileNotFoundError()
    }

    return document
  }
}
