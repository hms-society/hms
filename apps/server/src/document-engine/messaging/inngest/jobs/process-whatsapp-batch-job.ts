import { Injectable, Logger } from '@nestjs/common'
import { WhatsappDocumentBatchReceivedEvent } from '@hms/core/document-engine/domain/events'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const whatsappDocumentBatchReceived = eventType(
  WhatsappDocumentBatchReceivedEvent._NAME,
  {
    schema: z.object({
      eventoId: z.string().uuid(),
      sender: z.string().min(1),
      clientId: z.string().uuid(),
      mimeType: z.string().min(1),
      originalName: z.string().min(1),
    }),
  },
)

@Injectable()
export class ProcessWhatsappBatchJob extends InngestJob {
  private static readonly logger = new Logger(ProcessWhatsappBatchJob.name)
  static readonly ID = 'document-engine/process-whatsapp-batch'
  readonly function: InngestFunction.Like

  constructor(inngest: InngestClient) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: ProcessWhatsappBatchJob.ID,
        name: 'Process WhatsApp Document Batch',
        triggers: [whatsappDocumentBatchReceived],
      },
      async ({ event, step }) =>
        step.run('process-batch-metadata', async () => {
          ProcessWhatsappBatchJob.logger.log(
            `Processing WhatsApp document batch ${JSON.stringify(event.data)}`,
          )
          return { status: 'received' }
        }),
    )
  }
}
