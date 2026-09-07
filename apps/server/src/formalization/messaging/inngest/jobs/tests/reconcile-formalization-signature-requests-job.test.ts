import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures/formalization-module-fixture'
import { ReconcileFormalizationSignatureRequestsJob } from '@/formalization/messaging/inngest/jobs/reconcile-formalization-signature-requests-job'

describe('Reconcile Formalization Signature Requests Job', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register({
      inngestJob: ReconcileFormalizationSignatureRequestsJob,
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  it('registers the bounded reconciler on a one-minute schedule', () => {
    expect(fixture.inngestFunctionOptions).toMatchObject({
      id: ReconcileFormalizationSignatureRequestsJob.ID,
      triggers: [{ cron: '* * * * *' }],
    })
  })

  it('completes without publication when there is no reconcilable request', async () => {
    const run = await fixture.invokeInngest()

    expect(run.status.toLowerCase()).toBe('completed')
    expect(fixture.broker.publish).not.toHaveBeenCalled()
  })
})
