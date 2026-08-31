import { Inject, Injectable } from '@nestjs/common'
import { WhatsappDocumentBatchReceivedEvent } from '@hms/core/document-engine/domain/events'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { integracaoEvento } from '@/shared/database/drizzle/schema/integracao-evento'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const whatsappEventReceived = eventType('whatsapp/event.received', {
  schema: z.record(z.string(), z.unknown()),
})

type WhatsappMedia = {
  id?: unknown
  mime_type?: unknown
  filename?: unknown
}

type WhatsappMessage = {
  type?: unknown
  from?: unknown
  document?: WhatsappMedia
  image?: WhatsappMedia
}

type WhatsappPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: WhatsappMessage[]
      }
    }>
  }>
}

@Injectable()
export class ProcessWhatsappEventJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(DrizzleClient)
    private readonly drizzleClient: DrizzleClient,
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
  ) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'communication/process-whatsapp-event',
        name: 'Process WhatsApp Event',
        triggers: [whatsappEventReceived],
      },
      async ({ event, step }) => {
        const payload = event.data as WhatsappPayload
        const messages = payload.entry?.[0]?.changes?.[0]?.value?.messages

        if (!messages) {
          return
        }

        await step.run('route-whatsapp-media', async () => {
          const database = this.drizzleClient.requireDatabase()

          for (const message of messages) {
            if (message.type !== 'document' && message.type !== 'image') {
              continue
            }

            const media = message.type === 'document' ? message.document : message.image
            const sender = message.from

            if (
              typeof media?.id !== 'string' ||
              typeof media.mime_type !== 'string' ||
              typeof sender !== 'string'
            ) {
              continue
            }

            const normalizedSender = sender.startsWith('+') ? sender : `+${sender}`
            const clients = await this.clientsRepository.findByPhone(normalizedSender)
            const client = clients[0]

            if (!client) {
              await database.insert(integracaoEvento).values({
                provedor: 'whatsapp',
                payload: message,
                status: 'falha_definitiva',
                erro: 'Rejeitado: Número desconhecido, não vinculado a um cliente HMS.',
              })
              continue
            }

            const [evento] = await database
              .insert(integracaoEvento)
              .values({
                provedor: 'whatsapp',
                payload: message,
                status: 'recebido',
              })
              .returning()

            await step.sendEvent('dispatch-document-batch', {
              name: WhatsappDocumentBatchReceivedEvent._NAME,
              data: {
                eventoId: evento.id,
                sender,
                clientId: client.id,
                mimeType: media.mime_type,
                originalName:
                  typeof media.filename === 'string'
                    ? media.filename
                    : `${media.id}.${media.mime_type.split('/')[1]}`,
              },
            })
          }
        })
      },
    )
  }
}
