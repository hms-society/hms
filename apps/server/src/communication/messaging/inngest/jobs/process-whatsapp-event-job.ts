import { Inject, Injectable } from '@nestjs/common'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import type { ClientsRepository } from '@hms/core/identity/interfaces'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { communicationModel } from '@/communication/database/drizzle/models/communication-model'
import { privateMessageModel } from '@/communication/database/drizzle/models/private-message-model'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { integracaoEvento } from '@/shared/database/drizzle/schema/integracao-evento'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { encrypt } from '@/shared/utils/crypto'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

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
  text?: {
    body?: unknown
  }
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
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: IntakesRepository,
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

        const eventsToDispatch = await step.run('route-whatsapp-media', async () => {
          const database = this.drizzleClient.requireDatabase()
          const events: Array<{
            name: 'documents/whatsapp.batch.received'
            data: Record<string, unknown>
          }> = []

          for (const message of messages) {
            const sender = message.from
            if (typeof sender !== 'string') {
              continue
            }

            // Process text messages
            if (message.type === 'text') {
              const textBody =
                typeof message.text?.body === 'string' ? message.text.body : undefined

              if (!textBody) {
                continue
              }

              const matchingClients = await this.clientsRepository.findByPhoneSuffix(
                sender.slice(-8),
              )

              const clientId =
                matchingClients.length === 1 ? matchingClients[0].id : undefined

              if (clientId) {
                // 1. Save summary entry in communications table (for Central de Comunicação)
                await database.insert(communicationModel).values({
                  clientId,
                  authorId: null,
                  channel: 'whatsapp',
                  direction: 'inbound',
                  content: 'Mensagem de texto recebida via WhatsApp',
                })

                // 2. Search active intake to save encrypted private message for the lawyer
                const activeIntakes =
                  await this.intakesRepository.findByClientId(clientId)

                const activeIntake =
                  activeIntakes.find(
                    (intake) => intake.status !== IntakeStatus.ClosedWithoutContract,
                  ) || activeIntakes[0]

                if (activeIntake?.responsibleId) {
                  await database.insert(privateMessageModel).values({
                    clientId,
                    collaboratorId: activeIntake.responsibleId,
                    intakeId: activeIntake.id,
                    clientPhone: sender,
                    direction: 'inbound',
                    content: encrypt(textBody),
                    fileIds: [],
                  })
                }
              }

              continue
            }

            // Process document / image media
            if (message.type === 'document' || message.type === 'image') {
              const media = message.type === 'document' ? message.document : message.image

              if (typeof media?.id !== 'string' || typeof media.mime_type !== 'string') {
                continue
              }

              const matchingClients = await this.clientsRepository.findByPhoneSuffix(
                sender.slice(-8),
              )

              const clientId =
                matchingClients.length === 1 ? matchingClients[0].id : undefined

              const [evento] = await database
                .insert(integracaoEvento)
                .values({
                  provedor: 'whatsapp',
                  payload: message,
                  status: 'recebido',
                })
                .returning()

              events.push({
                name: 'documents/whatsapp.batch.received',
                data: {
                  eventoId: evento.id,
                  sender,
                  clientId,
                  mediaId: media.id,
                  mimeType: media.mime_type,
                  originalName:
                    typeof media.filename === 'string'
                      ? media.filename
                      : `${media.id}.${media.mime_type.split('/')[1]}`,
                },
              })
            }
          }

          return events
        })

        if (eventsToDispatch && eventsToDispatch.length > 0) {
          await step.sendEvent('dispatch-document-batches', eventsToDispatch)
        }
      },
    )
  }
}
