import { FormalizationSignaturePreviewBatchGenerationRequestedEvent } from '@hms/core/formalization/domain'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures/formalization-module-fixture'
import { GenerateFormalizationSignaturePreviewsInBatchJob } from '@/formalization/messaging/inngest/jobs/generate-formalization-signature-previews-in-batch-job'

describe('Generate Formalization Signature Previews In Batch Job', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register({
      inngestJob: GenerateFormalizationSignaturePreviewsInBatchJob,
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('fans out one event per preview through a real Inngest run', async () => {
    const event = new FormalizationSignaturePreviewBatchGenerationRequestedEvent({
      formalizationId: fixture.idProvider.generate(),
      items: [
        {
          previewId: fixture.idProvider.generate(),
          attemptToken: fixture.idProvider.generate(),
        },
        {
          previewId: fixture.idProvider.generate(),
          attemptToken: fixture.idProvider.generate(),
        },
      ],
      occurredAt: fixture.datetimeProvider.now().toISOString(),
    })

    const run = await fixture.runInngest({
      name: event.name,
      data: event.payload,
    })

    expect(run.status.toLowerCase()).toBe('completed')
  })

  it('rejects duplicate previews before fan-out', async () => {
    const previewId = fixture.idProvider.generate()
    const event = new FormalizationSignaturePreviewBatchGenerationRequestedEvent({
      formalizationId: fixture.idProvider.generate(),
      items: [
        {
          previewId,
          attemptToken: fixture.idProvider.generate(),
        },
        {
          previewId,
          attemptToken: fixture.idProvider.generate(),
        },
      ],
      occurredAt: fixture.datetimeProvider.now().toISOString(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('failed')
  })
})
