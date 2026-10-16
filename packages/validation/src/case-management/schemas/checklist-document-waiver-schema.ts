import { z } from 'zod'
export const grantChecklistDocumentWaiverSchema = z.strictObject({
  operationId: z.uuid(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  justification: z.string().trim().min(1),
})
export const revokeChecklistDocumentWaiverSchema = z.strictObject({
  operationId: z.uuid(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
})
