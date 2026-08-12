import { Inject, Injectable } from '@nestjs/common'
import {
  DocumentGenerationCancelledEvent,
  DocumentGenerationRequestedEvent,
} from '@hms/core/document-production/domain/events'
import type { GenerateDocumentWorkflow } from '@hms/core/document-production/interfaces'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { documentGenerationSourceSchema } from '@/document-production/ai/mastra/schemas'
import { DOCUMENT_PRODUCTION_WORKFLOWS } from '@/document-production/constants/document-production-workflows'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const documentGenerationRequestedEvent = eventType(
  DocumentGenerationRequestedEvent._NAME,
  {
    schema: z.object({
      documentGenerationId: z.string().uuid(),
      documentId: z.string().uuid(),
      documentSpecificationVersionId: z.string().uuid(),
      requestedByCollaboratorId: z.string().uuid(),
      source: documentGenerationSourceSchema,
      occurredAt: z.string().datetime(),
    }),
  },
)

const documentGenerationCancelledEvent = eventType(
  DocumentGenerationCancelledEvent._NAME,
  {
    schema: z.object({
      documentGenerationId: z.string().uuid(),
      occurredAt: z.string().datetime(),
    }),
  },
)

@Injectable()
export class GenerateDocumentJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(DOCUMENT_PRODUCTION_WORKFLOWS.generateDocument)
    workflow: GenerateDocumentWorkflow,
  ) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'document-production/generate-document',
        name: 'Generate Document',
        cancelOn: [
          {
            event: documentGenerationCancelledEvent,
            match: 'data.documentGenerationId',
          },
        ],
        triggers: [documentGenerationRequestedEvent],
      },
      async ({ event, step }) =>
        step.run('generate-document', () =>
          workflow.run({
            documentGenerationId: event.data.documentGenerationId,
            documentId: event.data.documentId,
            documentSpecificationVersionId: event.data.documentSpecificationVersionId,
            requestedByCollaboratorId: event.data.requestedByCollaboratorId,
            source: event.data.source,
          }),
        ),
    )
  }
}
