import { Inject, Injectable } from '@nestjs/common'
import { desc, eq, like } from 'drizzle-orm'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { privateMessageModel } from '@/communication/database/drizzle/models/private-message-model'
import { clientModel } from '@/identity/database/drizzle/models'
import { intakeModel } from '@/intake/database/drizzle/models/intake-model'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { integracaoEvento } from '@/shared/database/drizzle/schema/integracao-evento'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { encrypt } from '@/shared/utils/crypto'

const whatsappEventReceived = eventType('whatsapp/event.received', {
  schema: z.record(z.string(), z.unknown()),
})

type WhatsappMedia = {
  id?: unknown
  mime_type?: unknown
  filename?: unknown
  caption?: unknown
}

type WhatsappText = {
  body?: unknown
}

type WhatsappInteractive = {
  button_reply?: { title?: unknown }
  list_reply?: { title?: unknown }
}

type WhatsappMessage = {
  type?: unknown
  from?: unknown
  text?: WhatsappText
  document?: WhatsappMedia
  image?: WhatsappMedia
  interactive?: WhatsappInteractive
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

        await step.run('process-inbound-whatsapp-messages', async () => {
          const database = this.drizzleClient.requireDatabase()

          for (const message of messages) {
            const sender = message.from
            if (typeof sender !== 'string') {
              continue
            }

            const cleanSender = sender.replace(/\D/g, '')
            const searchSuffix =
              cleanSender.length >= 8 ? cleanSender.slice(-8) : cleanSender

            const [client] = await database
              .select()
              .from(clientModel)
              .where(like(clientModel.phone, `%${searchSuffix}`))
              .limit(1)

            if (!client) {
              await database.insert(integracaoEvento).values({
                provedor: 'whatsapp',
                payload: message,
                status: 'falha_definitiva',
                erro: 'Rejeitado: Número desconhecido, não vinculado a um cliente HMS.',
              })
              continue
            }

            const [intake] = await database
              .select({
                id: intakeModel.id,
                responsibleId: intakeModel.responsibleId,
              })
              .from(intakeModel)
              .where(eq(intakeModel.clientId, client.id))
              .orderBy(desc(intakeModel.createdAt))
              .limit(1)

            let rawContent = ''
            if (message.type === 'text' && typeof message.text?.body === 'string') {
              rawContent = message.text.body
            } else if (message.type === 'image') {
              rawContent =
                typeof message.image?.caption === 'string'
                  ? message.image.caption
                  : '[Imagem recebida]'
            } else if (message.type === 'document') {
              rawContent =
                typeof message.document?.caption === 'string'
                  ? message.document.caption
                  : '[Documento recebido]'
            } else if (message.type === 'audio') {
              rawContent = '[Áudio recebido]'
            } else if (message.type === 'interactive') {
              rawContent =
                (typeof message.interactive?.button_reply?.title === 'string'
                  ? message.interactive.button_reply.title
                  : undefined) ||
                (typeof message.interactive?.list_reply?.title === 'string'
                  ? message.interactive.list_reply.title
                  : undefined) ||
                '[Resposta interativa]'
            } else {
              rawContent = `[Mensagem ${typeof message.type === 'string' ? message.type : 'recebida'}]`
            }

            // Save inbound private message to private_messages table
            await database.insert(privateMessageModel).values({
              clientId: client.id,
              collaboratorId: intake?.responsibleId || null,
              intakeId: intake?.id || null,
              clientPhone: sender,
              direction: 'inbound',
              content: encrypt(rawContent),
            })

            // Route document/image media if applicable
            if (message.type === 'document' || message.type === 'image') {
              const media = message.type === 'document' ? message.document : message.image

              if (typeof media?.id === 'string' && typeof media.mime_type === 'string') {
                const [evento] = await database
                  .insert(integracaoEvento)
                  .values({
                    provedor: 'whatsapp',
                    payload: message,
                    status: 'recebido',
                  })
                  .returning()

                await step.sendEvent('dispatch-document-batch', {
                  name: 'documents/whatsapp.batch.received',
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
            }
          }
        })
      },
    )
  }
}
