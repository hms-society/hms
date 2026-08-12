import { Injectable } from '@nestjs/common'
import {
  DocumentBatchGenerationRequestedEvent,
  DocumentGenerationRequestedEvent,
} from '@hms/core/document-production/domain/events'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { documentGenerationSourceSchema } from '@/document-production/ai/mastra/schemas'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const documentBatchGenerationRequestedEvent = eventType(
  DocumentBatchGenerationRequestedEvent._NAME,
  {
    schema: z.object({
      documents: z
        .array(
          z.object({
            documentGenerationId: z.string().uuid(),
            documentId: z.string().uuid(),
            documentSpecificationVersionId: z.string().uuid(),
          }),
        )
        .min(1),
      requestedByCollaboratorId: z.string().uuid(),
      source: documentGenerationSourceSchema,
      occurredAt: z.string().datetime(),
    }),
  },
)

@Injectable()
export class GenerateDocumentsInBatchJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(inngest: InngestClient) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'document-production/generate-documents-in-batch',
        name: 'Generate Documents in Batch',
        triggers: [documentBatchGenerationRequestedEvent],
      },
      async ({ event, step }) =>
        step.sendEvent(
          'fan-out-document-generations',
          event.data.documents.map((document) => {
            const requestedEvent = new DocumentGenerationRequestedEvent({
              ...document,
              requestedByCollaboratorId: event.data.requestedByCollaboratorId,
              source: event.data.source,
              occurredAt: new Date(event.data.occurredAt),
            })

            return {
              name: requestedEvent.name,
              data: requestedEvent.payload,
            }
          }),
        ),
    )
  }
}
