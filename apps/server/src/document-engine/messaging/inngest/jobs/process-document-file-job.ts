import { Inject, Injectable } from '@nestjs/common'
import {
  DocumentFileExtractionCompletedEvent,
  DocumentFileProcessingRequestedEvent,
} from '@hms/core/document-engine/domain/events'
import type { ProcessDocumentFileWorkflow } from '@hms/core/document-engine/interfaces'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { DOCUMENT_ENGINE_WORKFLOWS } from '@/document-engine/constants/document-engine-workflows'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const documentFileProcessingRequested = eventType(
  DocumentFileProcessingRequestedEvent._NAME,
  {
    schema: z.object({
      batchId: z.string().uuid(),
      documentFileId: z.string().uuid(),
      storagePath: z.string().min(1),
      originalName: z.string().min(1),
      mimeType: z.string().min(1),
      sizeBytes: z.number().int().min(0),
    }),
  },
)

@Injectable()
export class ProcessDocumentFileJob extends InngestJob {
  static readonly ID = 'document-engine/process-document-file'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(DOCUMENT_ENGINE_WORKFLOWS.processDocumentFile)
    workflow: ProcessDocumentFileWorkflow,
  ) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: ProcessDocumentFileJob.ID,
        name: 'Process Document File',
        triggers: [documentFileProcessingRequested],
      },
      async ({ event, step }) => {
        const result = await step.run('process-document-file', async () =>
          workflow.run(event.data),
        )

        if (
          !event.data.mimeType.startsWith('image/') ||
          event.data.storagePath.startsWith('seed/')
        ) {
          return result
        }

        const completedEvent = new DocumentFileExtractionCompletedEvent({
          batchId: event.data.batchId,
          documentFileId: result.documentFileId,
          metadata: result.metadata,
        })

        await step.sendEvent('send-document-file-extraction-completed', {
          name: completedEvent.name,
          data: completedEvent.payload,
        })

        return result
      },
    )
  }
}
