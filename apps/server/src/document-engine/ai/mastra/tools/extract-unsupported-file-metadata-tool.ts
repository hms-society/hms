import { createTool } from '@mastra/core/tools'
import { Injectable } from '@nestjs/common'
import { z } from 'zod'

const inputSchema = z.object({
  batchId: z.string().uuid(),
  documentFileId: z.string().uuid(),
  storagePath: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  contentBase64: z.string(),
  hashSha256: z.string().length(64),
})

const outputSchema = z.object({
  documentFileId: z.string().uuid(),
  metadata: z.object({
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().min(0),
    hashSha256: z.string().length(64),
    textLength: z.number().int().min(0),
    extractedTextFull: z.string(),
  }),
})

@Injectable()
export class ExtractUnsupportedFileTool {
  readonly function: ReturnType<
    typeof createTool<
      'extract-unsupported-file-metadata',
      typeof inputSchema,
      typeof outputSchema
    >
  >

  constructor() {
    this.function = createTool({
      id: 'extract-unsupported-file-metadata',
      description: 'Capture basic metadata for a file type without OCR support.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => ({
        documentFileId: input.documentFileId,
        metadata: {
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          hashSha256: input.hashSha256,
          textLength: 0,
          extractedTextFull: '',
        },
      }),
    })
  }
}
