import { Injectable, Logger } from '@nestjs/common'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const whatsappEventReceivedEvent = eventType('whatsapp/event.received', {
  schema: z.record(z.string(), z.unknown()),
})

@Injectable()
export class ProcessWhatsappEventJob extends InngestJob {
  private static readonly logger = new Logger(ProcessWhatsappEventJob.name)
  readonly function: InngestFunction.Like

  constructor(inngest: InngestClient) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'communication/process-whatsapp-event',
        name: 'Process WhatsApp Event',
        triggers: [whatsappEventReceivedEvent],
      },
      async ({ step }) => {
        return step.run('process-whatsapp-event', async () => {
          ProcessWhatsappEventJob.logger.log(
            'Inngest is processing whatsapp/event.received',
          )

          // TODO: Route the received event to the application operation responsible for
          // messages, documents, or interactive scheduling responses.
          return { status: 'received' }
        })
      },
    )
  }
}
