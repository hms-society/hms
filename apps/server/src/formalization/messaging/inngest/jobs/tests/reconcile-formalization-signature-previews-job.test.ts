import { FormalizationSignaturePreviewBatchGenerationRequestedEvent } from '@hms/core/formalization/domain'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures/formalization-module-fixture'
import { ReconcileFormalizationSignaturePreviewsJob } from '@/formalization/messaging/inngest/jobs/reconcile-formalization-signature-previews-job'

describe('Reconcile Formalization Signature Previews Job', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register({
      inngestJob: ReconcileFormalizationSignaturePreviewsJob,
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
    vi.clearAllMocks()
  })

  it('registers the bounded reconciler on a one-minute schedule', () => {
    expect(fixture.inngestFunctionOptions).toMatchObject({
      id: ReconcileFormalizationSignaturePreviewsJob.ID,
      triggers: [{ cron: '* * * * *' }],
    })
  })

  it('reschedules persisted work and publishes its durable attempt', async () => {
    const preview = await fixture.seedPendingSignaturePreview()

    const run = await fixture.invokeInngest()

    expect(run.status.toLowerCase()).toBe('completed')
    expect(fixture.broker.publish).toHaveBeenCalledTimes(1)
    const publishedEvent = fixture.broker.publish.mock.calls[0]?.[0]
    expect(publishedEvent).toMatchObject({
      name: FormalizationSignaturePreviewBatchGenerationRequestedEvent._NAME,
      payload: {
        formalizationId: preview.formalizationId,
        items: [
          {
            previewId: preview.previewId,
            attemptToken: expect.not.stringMatching(preview.attemptToken),
          },
        ],
        occurredAt: expect.any(String),
      },
    })

    const attemptToken = publishedEvent?.payload.items[0]?.attemptToken
    expect(attemptToken).toEqual(expect.any(String))
    const claimedAt = fixture.datetimeProvider.now()
    const claim = await fixture.signatureConfigurationRepository.claimPreview({
      previewId: preview.previewId,
      attemptToken: attemptToken as string,
      claimedAt,
      leaseExpiresAt: new Date(claimedAt.getTime() + 60_000),
    })
    expect(claim).toMatchObject({
      previewId: preview.previewId,
      attemptToken,
    })
  })

  it('completes without publication when there is no reconcilable work', async () => {
    const run = await fixture.invokeInngest()

    expect(run.status.toLowerCase()).toBe('completed')
    expect(fixture.broker.publish).not.toHaveBeenCalled()
  })

  it('groups pending previews from one formalization into one batch', async () => {
    const formalizationId = fixture.idProvider.generate()
    const first = await fixture.seedPendingSignaturePreview({ formalizationId })
    const second = await fixture.seedPendingSignaturePreview({ formalizationId })

    const run = await fixture.invokeInngest()

    expect(run.status.toLowerCase()).toBe('completed')
    expect(fixture.broker.publish).toHaveBeenCalledTimes(1)
    expect(fixture.broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: FormalizationSignaturePreviewBatchGenerationRequestedEvent._NAME,
        payload: expect.objectContaining({
          formalizationId,
          items: expect.arrayContaining([
            expect.objectContaining({ previewId: first.previewId }),
            expect.objectContaining({ previewId: second.previewId }),
          ]),
        }),
      }),
    )
  })
})
