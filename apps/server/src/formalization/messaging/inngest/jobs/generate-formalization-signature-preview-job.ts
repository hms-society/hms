import { Inject, Injectable } from '@nestjs/common'
import {
  FormalizationDocumentPdfConversionError,
  FormalizationDocumentPdfInspectionError,
  FormalizationSignatureDocumentVersionFileUnavailableError,
  FormalizationSignaturePreviewClaimConflictError,
} from '@hms/core/formalization/domain/errors'
import { FormalizationSignaturePreviewGenerationRequestedEvent } from '@hms/core/formalization/domain'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
  DocumentPdfConverter,
  FormalizationDocumentPdfInspector,
} from '@hms/core/formalization/interfaces'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import { ProcessFormalizationSignaturePreviewUseCase } from '@hms/core/formalization/use-cases'
import { FailFormalizationSignaturePreviewUseCase } from '@hms/core/formalization/use-cases'
import { formalizationSignaturePreviewEventSchema } from '@hms/validation/formalization'
import { eventType, type InngestFunction } from 'inngest'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
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
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    configurationRepository: FormalizationSignatureConfigurationRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(PROVISION_PROVIDERS.fileStorage)
    fileStorageProvider: FileStorageProvider,
    @Inject(FORMALIZATION_PROVIDERS.documentPdfConverter)
    documentPdfConverter: DocumentPdfConverter,
    @Inject(FORMALIZATION_PROVIDERS.documentPdfInspector)
    documentPdfInspector: FormalizationDocumentPdfInspector,
    datetimeProvider: DatetimeProvider,
  ) {
    super(inngest)

    const processPreview = new ProcessFormalizationSignaturePreviewUseCase(
      configurationRepository,
      sourceReader,
      fileStorageProvider,
      documentPdfConverter,
      documentPdfInspector,
      datetimeProvider,
    )
    const failPreview = new FailFormalizationSignaturePreviewUseCase(
      configurationRepository,
    )

    this.function = this.inngest.createFunction(
      {
        id: 'formalization/generate-signature-preview',
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
        step.run('generate-formalization-signature-preview', () =>
          processPreview.execute({
            formalizationId: event.data.formalizationId,
            previewId: event.data.previewId,
            attemptToken: event.data.attemptToken,
            traceId: event.data.previewId,
          }),
        ),
    )
  }

  private getFailureCode(error: Error) {
    if (error instanceof FormalizationSignaturePreviewClaimConflictError) {
      return 'conversion_unavailable' as const
    }
    if (error instanceof FormalizationSignatureDocumentVersionFileUnavailableError) {
      return 'document_version_file_unavailable' as const
    }
    if (error instanceof FormalizationDocumentPdfInspectionError) {
      return 'invalid_pdf' as const
    }
    if (error instanceof FormalizationDocumentPdfConversionError) {
      return error.retryable
        ? ('conversion_unavailable' as const)
        : ('conversion_rejected' as const)
    }
    return 'storage_unavailable' as const
  }
}
