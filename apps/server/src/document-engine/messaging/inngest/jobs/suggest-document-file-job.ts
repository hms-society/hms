import { Inject, Injectable } from '@nestjs/common'
import { DocumentFileExtractionCompletedEvent } from '@hms/core/document-engine/domain/events'
import type { SuggestDocumentFileWorkflow } from '@hms/core/document-engine/interfaces'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { DOCUMENT_ENGINE_WORKFLOWS } from '@/document-engine/constants/document-engine-workflows'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const documentFileExtractionCompleted = eventType(
  DocumentFileExtractionCompletedEvent._NAME,
  {
    schema: z.object({
      batchId: z.string().uuid(),
      documentFileId: z.string().uuid(),
      metadata: z.object({
        mimeType: z.string().min(1),
        sizeBytes: z.number().int().min(0),
        hashSha256: z.string().length(64),
        pageCount: z.number().int().min(0).optional(),
        textLength: z.number().int().min(0).optional(),
        extractedTextFull: z.string().optional(),
      }),
    }),
  },
)

@Injectable()
export class SuggestDocumentFileJob extends InngestJob {
  static readonly ID = 'document-engine/suggest-document-file'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(DOCUMENT_ENGINE_WORKFLOWS.suggestDocumentFile)
    workflow: SuggestDocumentFileWorkflow,
  ) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: SuggestDocumentFileJob.ID,
        name: 'Suggest Document File',
        triggers: [documentFileExtractionCompleted],
      },
      async ({ event, step }) =>
        step.run('suggest-document-file', async () =>
          workflow.run({
            documentFileId: event.data.documentFileId,
            metadata: event.data.metadata,
          }),
        ),
    )
  }
}
