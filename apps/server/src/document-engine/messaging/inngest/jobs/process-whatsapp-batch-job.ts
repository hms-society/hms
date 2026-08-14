import { Injectable, Logger } from '@nestjs/common'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const whatsappDocumentBatchReceived = eventType('documents/whatsapp.batch.received', {
  schema: z.record(z.string(), z.unknown()),
})

@Injectable()
export class ProcessWhatsappBatchJob extends InngestJob {
  private static readonly logger = new Logger(ProcessWhatsappBatchJob.name)
  readonly function: InngestFunction.Like

  constructor(inngest: InngestClient) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'document-engine/process-whatsapp-batch',
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
