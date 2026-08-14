import { DocumentFileNotFoundError } from '../domain/errors'
import type {
  DocumentValidationAnalyzerProvider,
  DocumentValidationsRepository,
} from '../interfaces'

export type GetDocumentValidationAiResultRequest = {
  documentFileId: string
}

export class GetDocumentValidationAiResultUseCase {
  constructor(
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly documentValidationAnalyzerProvider: DocumentValidationAnalyzerProvider,
  ) {}

  async execute(request: GetDocumentValidationAiResultRequest) {
    const document = await this.documentValidationsRepository.findByFileId(
      request.documentFileId,
    )

    if (!document) {
      throw new DocumentFileNotFoundError()
    }

    return this.documentValidationAnalyzerProvider.analyze(document)
  }
}
