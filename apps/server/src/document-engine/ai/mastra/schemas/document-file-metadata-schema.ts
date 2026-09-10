import { z } from 'zod'

export const documentFileMetadataSchema = z.object({
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  hashSha256: z.string().length(64),
  pageCount: z.number().int().min(0).optional(),
  textLength: z.number().int().min(0).optional(),
  extractedTextFull: z.string().optional(),
})
