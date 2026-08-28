import type { InngestFunction } from 'inngest'
import { describe, expect, it, vi, type Mock } from 'vitest'

import { GenerateFormalizationSignaturePreviewsInBatchJob } from './generate-formalization-signature-previews-in-batch-job'

type BatchHandler = (context: {
  readonly event: {
    readonly data: {
      readonly formalizationId: string
      readonly items: readonly {
        readonly previewId: string
        readonly attemptToken: string
      }[]
      readonly occurredAt: string
    }
  }
  readonly step: { readonly sendEvent: Mock }
}) => Promise<unknown>

describe('Generate Formalization Signature Previews In Batch Job', () => {
  it('fans out one identifier-only event per preview in one step', async () => {
    let handler: BatchHandler | undefined
    const sendEvent = vi.fn().mockResolvedValue(undefined)
    const createFunction = vi.fn((_options: unknown, next: unknown) => {
      handler = next as BatchHandler
      return {} as InngestFunction.Like
    })
    const inngest = { createFunction } as never

    new GenerateFormalizationSignaturePreviewsInBatchJob(inngest)

    await handler?.({
      event: {
        data: {
          formalizationId: '00000000-0000-4000-8000-000000000001',
          items: [
            {
              previewId: '00000000-0000-4000-8000-000000000002',
              attemptToken: '00000000-0000-4000-8000-000000000003',
            },
            {
              previewId: '00000000-0000-4000-8000-000000000004',
              attemptToken: '00000000-0000-4000-8000-000000000005',
            },
          ],
          occurredAt: '2026-08-26T12:00:00.000Z',
        },
      },
      step: { sendEvent },
    })

    expect(sendEvent).toHaveBeenCalledWith('fan-out-formalization-signature-previews', [
      {
        name: 'formalization/signature-preview.generation-requested',
        data: {
          formalizationId: '00000000-0000-4000-8000-000000000001',
          previewId: '00000000-0000-4000-8000-000000000002',
          attemptToken: '00000000-0000-4000-8000-000000000003',
          occurredAt: '2026-08-26T12:00:00.000Z',
        },
      },
      {
        name: 'formalization/signature-preview.generation-requested',
        data: {
          formalizationId: '00000000-0000-4000-8000-000000000001',
          previewId: '00000000-0000-4000-8000-000000000004',
          attemptToken: '00000000-0000-4000-8000-000000000005',
          occurredAt: '2026-08-26T12:00:00.000Z',
        },
      },
    ])
  })
})
