import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getDocument, destroy } = vi.hoisted(() => ({
  destroy: vi.fn(),
  getDocument: vi.fn(),
}))

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({ getDocument }))

import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

import { ExtractImageTool } from '../extract-image-metadata-tool'
import { ExtractPdfTool } from '../extract-pdf-metadata-tool'

const HASH_SHA_256 = 'a388cba9c4ec5b2a9bdbe8327e3a46d67e7261cc698f24ce4b7185041cbf4cd3'

describe('Extract PDF Metadata Tool cleanup failures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getDocument.mockReturnValue({
      promise: Promise.reject(new Error('Invalid PDF structure')),
      destroy,
    })
    destroy.mockRejectedValue(new Error('PDF cleanup failed'))
  })

  it('preserves the PDF processing failure when loading task cleanup also fails', async () => {
    const tool = new ExtractPdfTool(new ExtractImageTool({ generate: vi.fn() } as never))

    const result = await tool.function.execute?.(
      {
        batchId: '8d307185-4869-4a3a-b781-2dae902f821d',
        documentFileId: '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba1',
        storagePath: 'documents/file.pdf',
        originalName: 'file.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 4,
        contentBase64: Buffer.from('bad!').toString('base64'),
        hashSha256: HASH_SHA_256,
      },
      {} as never,
    )

    expect(result?.suggestion?.suggestedStatus).toBe(
      DocumentValidationStatus.ProcessingFailure,
    )
    expect(result?.suggestion?.failureReason).toContain('Invalid PDF structure')
    expect(destroy).toHaveBeenCalledOnce()
  })
})
