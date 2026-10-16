import { z } from 'zod'
export const prepareChecklistUploadSchema = z.strictObject({
  operationId: z.uuid(),
  name: z.string().trim().min(1).max(255),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024),
})
export const attachChecklistDocumentSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('existing'),
    documentId: z.uuid(),
    operationId: z.uuid(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
  }),
  z.strictObject({
    kind: z.literal('upload'),
    uploadId: z.uuid(),
    operationId: z.uuid(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
  }),
])
export const validateChecklistDocumentSchema = z.strictObject({
  operationId: z.uuid(),
  clientDocumentId: z.uuid(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
})
