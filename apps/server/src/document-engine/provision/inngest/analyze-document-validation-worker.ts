import { Inject, Injectable, type OnModuleInit } from '@nestjs/common'
import { DocumentValidationAnalysisRequestedEvent } from '@hms/core/document-engine/domain/events'
import type {
  DocumentValidationAnalyzerProvider,
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '@hms/core/document-engine/interfaces'
import { AnalyzeDocumentValidationUseCase } from '@hms/core/document-engine/use-cases'
import { z } from 'zod'

import { DOCUMENT_VALIDATION_PROVIDERS } from '@/document-engine/constants/document-validation-providers'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { InngestService } from '@/shared/provision/inngest/inngest.service'

const documentValidationAnalysisRequestedSchema = z.object({
  documentFileId: z.string().uuid(),
  requestedBy: z.string().uuid(),
  occurredAt: z.string().datetime(),
})

@Injectable()
export class AnalyzeDocumentValidationWorker implements OnModuleInit {
  private readonly useCase: AnalyzeDocumentValidationUseCase

  constructor(
    @Inject(InngestService)
    private readonly inngestService: InngestService,
    @Inject(DOCUMENT_ENGINE.documentValidations)
    documentValidationsRepository: DocumentValidationsRepository,
    @Inject(DOCUMENT_VALIDATION_PROVIDERS.analyzer)
    documentValidationAnalyzerProvider: DocumentValidationAnalyzerProvider,
    @Inject(DOCUMENT_ENGINE.documentValidationLogs)
    documentValidationLogsRepository: DocumentValidationLogsRepository,
  ) {
    this.useCase = new AnalyzeDocumentValidationUseCase(
      documentValidationsRepository,
      documentValidationAnalyzerProvider,
      documentValidationLogsRepository,
    )
  }

  onModuleInit() {
    this.inngestService.register(
      this.inngestService.client.createFunction(
        {
          id: 'document-engine/analyze-document-validation',
          name: 'Analyze Document Validation',
          triggers: [{ event: DocumentValidationAnalysisRequestedEvent._NAME }],
        },
        async ({ event, step }) => {
          const data = documentValidationAnalysisRequestedSchema.parse(event.data)

          return step.run('analyze-document-validation', () =>
            this.useCase.execute({
              documentFileId: data.documentFileId,
              requestedBy: data.requestedBy,
            }),
          )
        },
      ),
    )
  }
}
