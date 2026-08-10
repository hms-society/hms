import { Injectable, Logger } from '@nestjs/common'
import { Inngest, type InngestFunction } from 'inngest'
import { WhatsappProvider } from '../../communication/whatsapp.provider'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { privateMessageModel } from '@/communication/database/drizzle/models/private-message-model'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { intakeModel } from '@/intake/database/drizzle/models/intake-model'
import { eq, desc } from 'drizzle-orm'
import { encrypt } from '@/shared/utils/crypto'

@Injectable()
export class InngestService {
  private readonly logger = new Logger(InngestService.name)
  public readonly client: Inngest

  constructor(
    private readonly drizzleClient: DrizzleClient,
    readonly _whatsappProvider: WhatsappProvider,
  ) {
    this.client = new Inngest({ id: 'hms-server' })
  }

  getFunctions(): InngestFunction.Like[] {
    return [
      this.client.createFunction(
        {
          id: 'whatsapp-event-received',
          name: 'WhatsApp Event Received',
          triggers: [{ event: 'whatsapp/event.received' }],
        },
        async ({ event, step }) => {
          this.logger.log('Inngest processando evento whatsapp/event.received')
          const payload = event.data

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

                  const db = this.drizzleClient.requireDatabase()
                  const [client] = await db
                    .select({ id: clientModel.id, phone: clientModel.phone })
                    .from(clientModel)
                    .where(eq(clientModel.phone, fromPhone))
                    .limit(1)

                  if (client) {
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
