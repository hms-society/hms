import { z } from 'zod'

export const inputSchema = z.object({
  batchId: z.string().uuid(),
  documentFileId: z.string().uuid(),
  storagePath: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
})

export const metadataSchema = z.object({
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  hashSha256: z.string().length(64),
  pageCount: z.number().int().min(0).optional(),
  textLength: z.number().int().min(0).optional(),
  extractedTextFull: z.string().optional(),
})

export const outputSchema = z.object({
  documentFileId: z.string().uuid(),
  metadata: metadataSchema,
})
