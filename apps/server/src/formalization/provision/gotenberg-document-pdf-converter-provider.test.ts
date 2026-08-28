import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { EnvProvider } from '@/shared/provision/env/env-provider'
import { FormalizationDocumentPdfConversionError } from '@hms/core/formalization/domain/errors'

import { GotenbergDocumentPdfConverterProvider } from './gotenberg-document-pdf-converter-provider'

describe('GotenbergDocumentPdfConverterProvider', () => {
  const fetchMock = vi.fn()
  const envProvider = {
    get(key: string) {
      const values = {
        GOTENBERG_URL: 'http://127.0.0.1:3001',
        GOTENBERG_TIMEOUT_MS: 1000,
        GOTENBERG_MAX_INPUT_BYTES: 4,
        GOTENBERG_MAX_OUTPUT_BYTES: 8,
      }
      return values[key as keyof typeof values]
    },
  } as EnvProvider

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([37, 80, 68, 70, 1]), {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      }),
    )
  })

  it('converts bounded DOCX bytes through the private endpoint', async () => {
    const provider = new GotenbergDocumentPdfConverterProvider(envProvider)

    await expect(
      provider.convert({
        fileName: 'contract.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        content: new Uint8Array([1, 2]),
        traceId: 'trace-id',
      }),
    ).resolves.toEqual({
      contentType: 'application/pdf',
      content: new Uint8Array([37, 80, 68, 70, 1]),
      converterVersion: 'gotenberg-8.34.0',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3001/forms/libreoffice/convert',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('classifies converter responses without exposing the remote body', async () => {
    fetchMock.mockResolvedValue(new Response('remote details', { status: 503 }))
    const provider = new GotenbergDocumentPdfConverterProvider(envProvider)

    await expect(
      provider.convert({
        fileName: 'contract.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        content: new Uint8Array([1]),
        traceId: 'trace-id',
      }),
    ).rejects.toMatchObject<Partial<FormalizationDocumentPdfConversionError>>({
      retryable: true,
      message: 'O conversor de PDF está temporariamente indisponível.',
    })
  })

  it('rejects oversized input before making a network request', async () => {
    const provider = new GotenbergDocumentPdfConverterProvider(envProvider)

    await expect(
      provider.convert({
        fileName: 'contract.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        content: new Uint8Array([1, 2, 3, 4, 5]),
        traceId: 'trace-id',
      }),
    ).rejects.toMatchObject({ retryable: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
