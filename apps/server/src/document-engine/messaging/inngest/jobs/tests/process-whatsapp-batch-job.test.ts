import { WhatsappDocumentBatchReceivedEvent } from '@hms/core/document-engine/domain/events'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { ProcessWhatsappBatchJob } from '@/document-engine/messaging/inngest/jobs/process-whatsapp-batch-job'

describe('Process WhatsApp Batch Job', () => {
  let fixture: DocumentEngineModuleFixture

  beforeAll(async () => {
    fixture = await DocumentEngineModuleFixture.register({
      inngestJob: ProcessWhatsappBatchJob,
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('executes through a real client and Inngest container', async () => {
    const event = new WhatsappDocumentBatchReceivedEvent({
      eventoId: fixture.idProvider.generate(),
      sender: '+5511999999999',
      clientId: fixture.idProvider.generate(),
      mimeType: 'application/pdf',
      originalName: 'document.pdf',
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.function?.id).toContain(ProcessWhatsappBatchJob.ID)
    expect(run.status.toLowerCase()).toBe('completed')
  })

  it('rejects incomplete document metadata before processing', async () => {
    const event = new WhatsappDocumentBatchReceivedEvent({
      eventoId: fixture.idProvider.generate(),
      sender: '+5511999999999',
      clientId: fixture.idProvider.generate(),
      mimeType: 'application/pdf',
      originalName: '',
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('failed')
  })
})
