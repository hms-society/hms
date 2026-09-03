import { createHash } from 'node:crypto'

import { createTool } from '@mastra/core/tools'
import { Inject, Injectable } from '@nestjs/common'
import type { StorageProvider } from '@hms/core/shared/interfaces'
import { z } from 'zod'

import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'

const inputSchema = z.object({
  batchId: z.string().uuid(),
  documentFileId: z.string().uuid(),
  storagePath: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
})

const outputSchema = inputSchema.extend({
  contentBase64: z.string(),
  hashSha256: z.string().length(64),
})

@Injectable()
export class LoadFileTool {
  readonly function: ReturnType<
    typeof createTool<'load-document-file', typeof inputSchema, typeof outputSchema>
  >

  constructor(@Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider) {
    this.function = createTool({
      id: 'load-document-file',
      description: 'Load a document file from storage and capture deterministic metadata.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        const content = Buffer.from(await this.storageProvider.download(input.storagePath))

        return {
          ...input,
          sizeBytes: content.length,
          contentBase64: content.toString('base64'),
          hashSha256: createHash('sha256').update(content).digest('hex'),
        }
      },
    })
  }
}
