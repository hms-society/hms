import { DocumentFileProcessingRequestedEvent } from '@hms/core/document-engine/domain/events'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { WHATSAPP_DOCUMENT_BATCH_RECEIVED_EVENT_NAME } from '@/shared/messaging/inngest/integration-event-names'
import { ProcessWhatsappBatchJob } from '../process-whatsapp-batch-job'

const ORIGINAL_NAME = 'Procuração inicial.pdf'

describe('ProcessWhatsappBatchJob', () => {
  let inngestFixture: InngestFixture
  let documentEngineFixture: DocumentEngineModuleFixture
  const processingRequests: Record<string, unknown>[] = []

  beforeAll(async () => {
    documentEngineFixture = await DocumentEngineModuleFixture.register()
    try {
      inngestFixture = await InngestFixture.register({
        createFunctions(client) {
          const useCase = documentEngineFixture.createDocumentBatchUseCase({
            publish: async (event) => {
              await client.send({ name: event.name, data: event.payload })
            },
          })
          const job = new ProcessWhatsappBatchJob(client, useCase)
          const observer = client.createFunction(
            {
              id: 'integration/observe-document-processing',
              triggers: [{ event: DocumentFileProcessingRequestedEvent._NAME }],
            },
            ({ event }) => {
              processingRequests.push(event.data)
            },
          )
          return [job.function, observer]
        },
      })
    } catch (error) {
      await documentEngineFixture.close()
      throw error
    }
  })

  afterAll(async () => {
    try {
      await inngestFixture?.close()
    } finally {
      await documentEngineFixture?.close()
    }
  })

  it('persists a WhatsApp batch and dispatches file processing through Inngest', async () => {
    await inngestFixture.client.send({
      name: WHATSAPP_DOCUMENT_BATCH_RECEIVED_EVENT_NAME,
      data: {
        eventoId: 'integration-event-1',
        sender: '5511999999999',
        originalName: ORIGINAL_NAME,
        mimeType: 'application/pdf',
        storagePath: 'whatsapp/integration-event-1/document.pdf',
        sizeBytes: 123,
      },
    })

    await expect
      .poll(
        async () =>
          (await documentEngineFixture.documentBatchesRepository.findTriageBatches())
            .items,
        { timeout: 20_000 },
      )
      .toEqual([
        expect.objectContaining({
          channel: 'whatsapp',
          sender: '5511999999999',
          files: [
            expect.objectContaining({ originalName: ORIGINAL_NAME, sizeBytes: 123 }),
          ],
        }),
      ])
    await expect.poll(() => processingRequests.length, { timeout: 20_000 }).toBe(1)
  }, 30_000)
})
