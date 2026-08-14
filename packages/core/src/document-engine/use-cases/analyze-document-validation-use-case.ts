import type {
  DocumentValidationAnalyzerProvider,
  DocumentValidationsRepository,
} from '../interfaces'
import { DocumentFileNotFoundError } from '../domain/errors'

export type AnalyzeDocumentValidationRequest = {
  documentFileId: string
}

export class AnalyzeDocumentValidationUseCase {
  constructor(
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly documentValidationAnalyzerProvider: DocumentValidationAnalyzerProvider,
  ) {}

  async execute(request: AnalyzeDocumentValidationRequest) {
    const document = await this.documentValidationsRepository.findByFileId(
      request.documentFileId,
    )

    if (!document) {
      throw new DocumentFileNotFoundError()
    }

    const analysis = await this.documentValidationAnalyzerProvider.analyze(document)

    return this.documentValidationsRepository.recordAnalysis({
      documentFileId: request.documentFileId,
      ...analysis,
    })
  }
}
