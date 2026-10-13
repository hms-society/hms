import { readFile } from 'node:fs/promises'
import { describe, expect, it, vi } from 'vitest'

import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

import { ExtractImageTool } from '../extract-image-metadata-tool'
import { ExtractPdfTool } from '../extract-pdf-metadata-tool'

const HASH_SHA_256 = 'a388cba9c4ec5b2a9bdbe8327e3a46d67e7261cc698f24ce4b7185041cbf4cd3'

describe('Extract PDF Metadata Tool', () => {
  it('extracts native text from a text PDF without calling image OCR', async () => {
    const pdf = await readFile(
      new URL('../../../../database/seed-assets/cnis.pdf', import.meta.url),
    )
    const imageAnalyzerAgent = { generate: vi.fn() }
    const tool = new ExtractPdfTool(new ExtractImageTool(imageAnalyzerAgent as never))

    const result = await tool.function.execute?.(createInput(pdf), {} as never)

    expect(result?.metadata.pageCount).toBe(1)
    expect(result?.metadata.extractedTextFull).toContain(
      'EXTRATO PREVIDENCIÁRIO FICTÍCIO',
    )
    expect(result?.suggestion).toBeUndefined()
    expect(imageAnalyzerAgent.generate).not.toHaveBeenCalled()
  })

  it('returns a processing failure when PDF.js cannot open the file', async () => {
    const malformedPdf = Buffer.from('not a PDF document')
    const imageAnalyzerAgent = { generate: vi.fn() }
    const tool = new ExtractPdfTool(new ExtractImageTool(imageAnalyzerAgent as never))

    const result = await tool.function.execute?.(createInput(malformedPdf), {} as never)

    expect(result?.metadata.pageCount).toBe(0)
    expect(result?.metadata.extractedTextFull).toBe('')
    expect(result?.suggestion?.suggestedStatus).toBe(
      DocumentValidationStatus.ProcessingFailure,
    )
    expect(result?.suggestion?.failureReason).toContain('Invalid PDF structure')
    expect(imageAnalyzerAgent.generate).not.toHaveBeenCalled()
  })
})

function createInput(content: Buffer) {
  return {
    batchId: '8d307185-4869-4a3a-b781-2dae902f821d',
    documentFileId: '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba1',
    storagePath: 'documents/file.pdf',
    originalName: 'file.pdf',
    mimeType: 'application/pdf',
    sizeBytes: content.length,
    contentBase64: content.toString('base64'),
    hashSha256: HASH_SHA_256,
  }
}
