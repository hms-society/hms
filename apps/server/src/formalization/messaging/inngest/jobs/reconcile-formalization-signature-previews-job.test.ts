import type { InngestFunction } from 'inngest'
import { describe, expect, it, vi, type Mock } from 'vitest'
import type { FormalizationSignatureConfigurationRepository } from '@hms/core/formalization/interfaces'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'

import { ReconcileFormalizationSignaturePreviewsJob } from './reconcile-formalization-signature-previews-job'

type ReconcileHandler = (context: {
  readonly step: { readonly run: Mock }
}) => Promise<unknown>

describe('Reconcile Formalization Signature Previews Job', () => {
  it('runs the bounded reconciler on a one-minute schedule', async () => {
    let options: Record<string, unknown> | undefined
    let handler: ReconcileHandler | undefined
    const run = vi
      .fn()
      .mockResolvedValue({ scheduledPreviewIds: [], cleanedPreviewIds: [] })
    const createFunction = vi.fn((nextOptions: unknown, next: unknown) => {
      options = nextOptions as Record<string, unknown>
      handler = next as ReconcileHandler
      return {} as InngestFunction.Like
    })
    const inngest = { createFunction } as never
    const repository = {} as FormalizationSignatureConfigurationRepository
    const fileStorageProvider = {} as FileStorageProvider
    const broker = { publish: vi.fn() }
    const datetimeProvider = { now: vi.fn() }

    new ReconcileFormalizationSignaturePreviewsJob(
      inngest,
      repository,
      fileStorageProvider,
      broker as never,
      datetimeProvider as never,
    )

    await handler?.({ step: { run } })

    expect(options).toMatchObject({
      triggers: [{ cron: '* * * * *' }],
    })
    expect(run).toHaveBeenCalledWith(
      'reconcile-formalization-signature-previews',
      expect.any(Function),
    )
  })
})
