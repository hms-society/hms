import { z } from 'zod'

export const documentFileJsonOrganizationRequestedSchema = z.object({
  batchId: z.string().uuid(),
  documentFileId: z.string().uuid(),
  storagePath: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  hashSha256: z.string().length(64),
  extractedTextFull: z.string().optional(),
})
