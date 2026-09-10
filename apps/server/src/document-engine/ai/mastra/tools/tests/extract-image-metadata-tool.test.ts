import { describe, expect, it, vi } from 'vitest'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

import { ExtractImageTool } from '../extract-image-metadata-tool'

const HASH_SHA_256 =
  'a388cba9c4ec5b2a9bdbe8327e3a46d67e7261cc698f24ce4b7185041cbf4cd3'

describe('Extract Image Metadata Tool', () => {
  it('returns processing failure when the image agent fails', async () => {
    const imageAnalyzerAgent = {
      generate: vi.fn().mockRejectedValue(new Error('Headers Timeout Error')),
    }
    const envProvider = {
      get: vi.fn().mockReturnValue(900_000),
    }
    const tool = new ExtractImageTool(imageAnalyzerAgent as never, envProvider as never)

    const result = await tool.function.execute(createInput())

    expect(result.metadata.extractedTextFull).toBe('')
    expect(result.suggestion?.suggestedStatus).toBe(
      DocumentValidationStatus.ProcessingFailure,
    )
    expect(result.suggestion?.failureReason).toContain('Headers Timeout Error')
  })

  it('does not call the image agent for a known duplicate suggestion', async () => {
    const imageAnalyzerAgent = {
      generate: vi.fn(),
    }
    const envProvider = {
      get: vi.fn().mockReturnValue(900_000),
    }
    const tool = new ExtractImageTool(imageAnalyzerAgent as never, envProvider as never)

    const result = await tool.function.execute(
      createInput({
        suggestion: {
          suggestedStatus: DocumentValidationStatus.Duplicate,
          confidence: 1,
          confidenceLabel: 'Duplicidade identificada por hash',
          extractedFields: [],
          missingFields: [],
          evidence: [],
        },
      }),
    )

    expect(imageAnalyzerAgent.generate).not.toHaveBeenCalled()
    expect(result.suggestion?.suggestedStatus).toBe(DocumentValidationStatus.Duplicate)
  })
})

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    batchId: '8d307185-4869-4a3a-b781-2dae902f821d',
    documentFileId: '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba1',
    storagePath: 'internal/teste_documento_id.png',
    originalName: 'teste_documento_id.png',
    mimeType: 'image/png',
    sizeBytes: 28_263,
    contentBase64: 'data:image/png;base64,AA==',
    hashSha256: HASH_SHA_256,
    ...overrides,
  }
}
