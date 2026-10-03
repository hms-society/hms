import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { CommunicationModuleFixture } from '@/communication/fixtures/communication-module-fixture'
import { WHATSAPP_WEBHOOK_RECEIVED_EVENT_NAME } from '@/shared/messaging/inngest/integration-event-names'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { ProcessWhatsappEventJob } from '../process-whatsapp-event-job'

const MESSAGE_ID = 'wamid.integration-test-1'

describe('ProcessWhatsappEventJob', () => {
  let inngestFixture: InngestFixture
  let communicationFixture: CommunicationModuleFixture

  beforeAll(async () => {
    communicationFixture = await CommunicationModuleFixture.register()
    try {
      inngestFixture = await InngestFixture.register({
        createFunctions(client) {
          const job = new ProcessWhatsappEventJob(
            client,
            communicationFixture.jobDrizzleClient,
          )
          return [job.function]
        },
      })
    } catch (error) {
      await communicationFixture.close()
      throw error
    }
  })

  afterAll(async () => {
    try {
      await inngestFixture?.close()
    } finally {
      await communicationFixture?.close()
    }
  })

  it('records a received WhatsApp message in PostgreSQL after Inngest dispatch', async () => {
    await inngestFixture.client.send({
      name: WHATSAPP_WEBHOOK_RECEIVED_EVENT_NAME,
      data: {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: MESSAGE_ID,
                      type: 'text',
                      from: '5511999999999',
                      text: { body: 'Hello' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    })

    await expect
      .poll(() => communicationFixture.findWhatsappEventByMessageId(MESSAGE_ID), {
        timeout: 20_000,
      })
      .toEqual([expect.objectContaining({ provedor: 'whatsapp', status: 'recebido' })])
  }, 30_000)
})
