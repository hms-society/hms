import { Injectable, Logger } from '@nestjs/common'
import { Inngest, type InngestFunction } from 'inngest'
import { eq, desc, like } from 'drizzle-orm'
import { WhatsappProvider } from '../../communication/whatsapp.provider'
import { DrizzleClient } from '../../database/drizzle/drizzle-client'
import { integracaoEvento } from '../../database/drizzle/schema/integracao-evento'
import { privateMessageModel } from '@/communication/database/drizzle/models/private-message-model'
import { clientModel } from '@/identity/database/drizzle/models'
import { intakeModel } from '@/intake/database/drizzle/models/intake-model'
import { encrypt } from '@/shared/utils/crypto'

@Injectable()
export class InngestService {
  private readonly logger = new Logger(InngestService.name)
  public readonly client: Inngest
  private readonly dynamicFunctions: InngestFunction.Like[] = []

  constructor(
    private readonly drizzleClient: DrizzleClient,
    readonly _whatsappProvider: WhatsappProvider,
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

          await step.run('process-whatsapp-event', async () => {
            const entries = payload?.entry ?? []
            for (const entry of entries) {
              const changes = entry?.changes ?? []
              for (const change of changes) {
                const value = change?.value
                const messages = value?.messages ?? []

                for (const msg of messages) {
                  const fromPhone = msg?.from
                  if (!fromPhone) continue

                  let rawContent = ''
                  if (msg.type === 'text' && msg.text?.body) {
                    rawContent = msg.text.body
                  } else if (msg.type === 'image') {
                    rawContent = msg.image?.caption || '[Imagem recebida]'
                  } else if (msg.type === 'document') {
                    rawContent = msg.document?.caption || '[Documento recebido]'
                  } else if (msg.type === 'interactive') {
                    rawContent =
                      msg.interactive?.button_reply?.title ||
                      msg.interactive?.list_reply?.title ||
                      '[Resposta interativa]'
                  } else {
                    rawContent = `[Mensagem ${msg.type ?? 'desconhecida'}]`
                  }

                  const [client] = await db
                    .select()
                    .from(clientModel)
                    .where(like(clientModel.phone, `%${fromPhone.slice(-8)}`))
                    .limit(1)

                  if (client) {
                    // 1. Process WhatsApp Media for Document Production System
                    if (msg.type === 'document' || msg.type === 'image') {
                      const media = msg.type === 'document' ? msg.document : msg.image

                      const [evento] = await db
                        .insert(integracaoEvento)
                        .values({
                          provedor: 'whatsapp',
                          payload: msg,
                          status: 'recebido',
                        })
                        .returning()

                      await step.sendEvent('dispatch-document-batch', {
                        name: 'documents/whatsapp.batch.received',
                        data: {
                          eventoId: evento.id,
                          sender: fromPhone,
                          clientId: client.id,
                          mimeType: media.mime_type,
                          originalName:
                            media.filename ||
                            `${media.id}.${media.mime_type.split('/')[1]}`,
                        },
                      })
                    }

                    // 2. Save Message to Case Private Message History
                    const [intake] = await db
                      .select({
                        id: intakeModel.id,
                        responsibleId: intakeModel.responsibleId,
                      })
                      .from(intakeModel)
                      .where(eq(intakeModel.clientId, client.id))
                      .orderBy(desc(intakeModel.createdAt))
                      .limit(1)

                    if (intake) {
                      await db.insert(privateMessageModel).values({
                        clientId: client.id,
                        collaboratorId: intake.responsibleId,
                        intakeId: intake.id,
                        clientPhone: fromPhone,
                        direction: 'inbound',
                        content: encrypt(rawContent),
                      })

                      this.logger.log(
                        `Mensagem privada inbound salva para o cliente ${client.id} (Telefone: ${fromPhone})`,
                      )
                    } else {
                      this.logger.warn(
                        `Mensagem recebida de cliente sem atendimento (intake) ativo: ${client.id}`,
                      )
                    }
                  } else {
                    // If client not found, still record the event as failed if it contains media
                    if (msg.type === 'document' || msg.type === 'image') {
                      await db.insert(integracaoEvento).values({
                        provedor: 'whatsapp',
                        payload: msg,
                        status: 'falha_definitiva',
                        erro: 'Rejeitado: Número desconhecido, não vinculado a um cliente HMS.',
                      })
                    }
                    this.logger.warn(
                      `Mensagem recebida de número não cadastrado: ${fromPhone}`,
                    )
                  }
                }
              }
            }
          })
        },
      ),
    ]
  }
}
