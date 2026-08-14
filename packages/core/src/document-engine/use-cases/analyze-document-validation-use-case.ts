import type {
  DocumentValidationAnalyzerProvider,
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '../interfaces'
import { DocumentFileNotFoundError } from '../domain/errors'
import { DocumentValidationLogAction } from '../domain/structures'

export type AnalyzeDocumentValidationRequest = {
  documentFileId: string
  requestedBy?: string
}

export class AnalyzeDocumentValidationUseCase {
  constructor(
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly documentValidationAnalyzerProvider: DocumentValidationAnalyzerProvider,
    private readonly documentValidationLogsRepository: DocumentValidationLogsRepository,
  ) {}

  async execute(request: AnalyzeDocumentValidationRequest) {
    const document = await this.documentValidationsRepository.findByFileId(
      request.documentFileId,
    )

    if (!document) {
      throw new DocumentFileNotFoundError()
    }

    const analysis = await this.documentValidationAnalyzerProvider.analyze(document)

    const analyzedDocument = await this.documentValidationsRepository.recordAnalysis({
      documentFileId: request.documentFileId,
      ...analysis,
    })

    await this.documentValidationLogsRepository.add({
      documentFileId: request.documentFileId,
      actorId: request.requestedBy,
      action: DocumentValidationLogAction.AnalysisRecorded,
      status: analysis.status,
      metadata: {
        aiConfidence: analysis.aiConfidence,
        aiSuggestion: analysis.aiSuggestion,
        missingFields: analysis.missingFields,
      },
    })

    return analyzedDocument
  }
}
