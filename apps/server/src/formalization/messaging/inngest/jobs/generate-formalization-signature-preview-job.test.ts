import type { InngestFunction } from 'inngest'
import { describe, expect, it, vi, type Mock } from 'vitest'
import type {
  DocumentPdfConverter,
  FormalizationDocumentPdfInspector,
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
} from '@hms/core/formalization/interfaces'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'

import { GenerateFormalizationSignaturePreviewJob } from './generate-formalization-signature-preview-job'

type PreviewHandler = (context: {
  readonly event: {
    readonly data: {
      readonly formalizationId: string
      readonly previewId: string
      readonly attemptToken: string
      readonly occurredAt: string
    }
  }
  readonly step: { readonly run: Mock }
}) => Promise<unknown>

describe('Generate Formalization Signature Preview Job', () => {
  const repository = {} as FormalizationSignatureConfigurationRepository
  const sourceReader = {} as FormalizationSignatureSourceReader
  const fileStorageProvider = {} as FileStorageProvider
  const converter = {} as DocumentPdfConverter
  const inspector = {} as FormalizationDocumentPdfInspector
  const datetimeProvider = { now: vi.fn() }

  it('declares bounded retry and conversion concurrency settings', () => {
    let options: Record<string, unknown> | undefined
    const createFunction = vi.fn((nextOptions: unknown) => {
      options = nextOptions as Record<string, unknown>
      return {} as InngestFunction.Like
    })
    const inngest = { createFunction } as never

    new GenerateFormalizationSignaturePreviewJob(
      inngest,
      repository,
      sourceReader,
      fileStorageProvider,
      converter,
      inspector,
      datetimeProvider,
    )

    expect(options).toMatchObject({
      concurrency: 2,
      retries: 3,
      timeouts: { finish: '2m' },
    })
  })

  it('executes processing inside one stable step', async () => {
    let handler: PreviewHandler | undefined
    const run = vi.fn().mockResolvedValue({ previewId: 'preview', state: 'ready' })
    const createFunction = vi.fn((_options: unknown, next: unknown) => {
      handler = next as PreviewHandler
      return {} as InngestFunction.Like
    })
    const inngest = { createFunction } as never

    new GenerateFormalizationSignaturePreviewJob(
      inngest,
      repository,
      sourceReader,
      fileStorageProvider,
      converter,
      inspector,
      datetimeProvider,
    )

    await handler?.({
      event: {
        data: {
          formalizationId: '00000000-0000-4000-8000-000000000001',
          previewId: '00000000-0000-4000-8000-000000000002',
          attemptToken: '00000000-0000-4000-8000-000000000003',
          occurredAt: '2026-08-26T12:00:00.000Z',
        },
      },
      step: { run },
    })

    expect(run).toHaveBeenCalledWith(
      'generate-formalization-signature-preview',
      expect.any(Function),
    )
  })
})
