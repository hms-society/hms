import { Injectable, Logger } from '@nestjs/common'
import { Inngest, type InngestFunction } from 'inngest'
import { eq, like } from 'drizzle-orm'
import { WhatsappProvider } from '../../communication/whatsapp.provider'
import { DrizzleClient } from '../../database/drizzle/drizzle-client'
import { integracaoEvento } from '../../database/drizzle/schema/integracao-evento'
import { clientModel } from '@/identity/database/drizzle/models'

@Injectable()
export class InngestService {
  private readonly logger = new Logger(InngestService.name)
  public readonly client: Inngest
  private readonly dynamicFunctions: InngestFunction.Like[] = []

  constructor(
    readonly _whatsappProvider: WhatsappProvider,
    private readonly drizzleClient: DrizzleClient,
  ) {
    this.client = new Inngest({ id: 'hms-server' })
  }

  register(fn: InngestFunction.Like) {
    this.dynamicFunctions.push(fn)
  }

  getFunctions(): InngestFunction.Like[] {
    return [
      ...this.dynamicFunctions,
      this.client.createFunction(
        {
          id: 'whatsapp-event-router',
          name: 'WhatsApp Event Router',
          triggers: [{ event: 'whatsapp/event.received' }],
        },
        async ({ event, step }) => {
          const db = this.drizzleClient.requireDatabase()
          const payload: any = event.data

          await step.run('route-whatsapp-media', async () => {
            const messages = payload?.entry?.[0]?.changes?.[0]?.value?.messages
            if (!messages || !Array.isArray(messages)) return

            for (const message of messages) {
              if (message.type === 'document' || message.type === 'image') {
                const media = message.type === 'document' ? message.document : message.image
                const sender = message.from

                const [client] = await db
                  .select()
                  .from(clientModel)
                  .where(like(clientModel.phone, `%${sender.slice(-8)}`))
                  .limit(1)

                if (!client) {
                  await db.insert(integracaoEvento).values({
                    provedor: 'whatsapp',
                    payload: message,
                    status: 'falha_definitiva',
                    erro: 'Rejeitado: Número desconhecido, não vinculado a um cliente HMS.',
                  })
                  continue 
                }

                const [evento] = await db.insert(integracaoEvento).values({
                  provedor: 'whatsapp',
                  payload: message,
                  status: 'recebido'
                }).returning()

                await step.sendEvent('dispatch-document-batch', {
                  name: 'documents/whatsapp.batch.received',
                  data: {
                    eventoId: evento.id,
                    sender: sender,
                    clientId: client.id,
                    mimeType: media.mime_type,
                    originalName: media.filename || `${media.id}.${media.mime_type.split('/')[1]}`
                  }
                })
              }
            }
          })
        },
      ),
    ]
  }
}