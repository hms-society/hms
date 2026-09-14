import { Inject, Injectable } from '@nestjs/common'
import {
  FormalizationSignatureDocumentVersionFileUnavailableError,
  FormalizationSignaturePreviewClaimConflictError,
} from '@hms/core/formalization/domain/errors'
import {
  DocumentPdfConversionError,
  DocumentPdfInspectionError,
} from '@hms/core/document-production/domain/errors'
import { FormalizationSignaturePreviewGenerationRequestedEvent } from '@hms/core/formalization/domain'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
} from '@hms/core/formalization/interfaces'
import type { DocumentPdfFreezeService } from '@hms/core/document-production/interfaces'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import { ProcessFormalizationSignaturePreviewUseCase } from '@hms/core/formalization/use-cases'
import { FailFormalizationSignaturePreviewUseCase } from '@hms/core/formalization/use-cases'
import { formalizationSignaturePreviewEventSchema } from '@hms/validation/formalization'
import { eventType, type InngestFunction, NonRetriableError } from 'inngest'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { DOCUMENT_PRODUCTION_PROVIDERS } from '@/document-production/constants/document-production-providers'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

const previewEvent = eventType(
  FormalizationSignaturePreviewGenerationRequestedEvent._NAME,
  {
    schema: formalizationSignaturePreviewEventSchema,
  },
)

@Injectable()
export class GenerateFormalizationSignaturePreviewJob extends InngestJob {
  static readonly ID = 'formalization/generate-signature-preview'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    configurationRepository: FormalizationSignatureConfigurationRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(PROVISION_PROVIDERS.fileStorage)
    fileStorageProvider: FileStorageProvider,
    @Inject(DOCUMENT_PRODUCTION_PROVIDERS.documentPdfFreezeService)
    documentPdfFreezeService: DocumentPdfFreezeService,
    datetimeProvider: DatetimeProvider,
  ) {
    super(inngest)

    const processPreview = new ProcessFormalizationSignaturePreviewUseCase(
      configurationRepository,
      sourceReader,
      fileStorageProvider,
      documentPdfFreezeService,
      datetimeProvider,
    )
    const failPreview = new FailFormalizationSignaturePreviewUseCase(
      configurationRepository,
    )

    this.function = this.inngest.createFunction(
      {
        id: GenerateFormalizationSignaturePreviewJob.ID,
        name: 'Generate Formalization Signature Preview',
        concurrency: 2,
        retries: 3,
        timeouts: { finish: '2m' },
        triggers: [previewEvent],
        onFailure: async ({ event, error }) => {
          const originalEvent = event.data.event
          await failPreview.execute({
            previewId: originalEvent.data.previewId,
            attemptToken: originalEvent.data.attemptToken,
            failureCode: this.getFailureCode(error),
            failedAt: new Date(originalEvent.data.occurredAt),
          })
        },
      },
      ({ event, step }) =>
        step.run('generate-formalization-signature-preview', async () => {
          try {
            return await processPreview.execute({
              formalizationId: event.data.formalizationId,
              previewId: event.data.previewId,
              attemptToken: event.data.attemptToken,
              traceId: event.data.previewId,
            })
          } catch (error) {
            if (this.isNonRetriable(error)) {
              throw new NonRetriableError(error.message, { cause: error })
            }

            throw error
          }
        }),
    )
  }

  private getFailureCode(error: Error) {
    if (error.cause instanceof Error) return this.getFailureCode(error.cause)

    if (error instanceof FormalizationSignaturePreviewClaimConflictError) {
      return 'conversion_unavailable' as const
    }
    if (error instanceof FormalizationSignatureDocumentVersionFileUnavailableError) {
      return 'document_version_file_unavailable' as const
    }
    if (error.message === 'O arquivo da versão do documento não está disponível.') {
      return 'document_version_file_unavailable' as const
    }
    if (error instanceof DocumentPdfInspectionError) {
      return 'invalid_pdf' as const
    }
    if (error instanceof DocumentPdfConversionError) {
      return error.retryable
        ? ('conversion_unavailable' as const)
        : ('conversion_rejected' as const)
    }
    return 'storage_unavailable' as const
  }

  private isNonRetriable(error: unknown): error is Error {
    return (
      error instanceof FormalizationSignaturePreviewClaimConflictError ||
      error instanceof FormalizationSignatureDocumentVersionFileUnavailableError ||
      error instanceof DocumentPdfInspectionError ||
      (error instanceof DocumentPdfConversionError && !error.retryable)
    )
  }
}
