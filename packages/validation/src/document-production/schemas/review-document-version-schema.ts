import { z } from 'zod'

const approvedSchema = z.object({ decision: z.literal('approved') }).strict()
const rejectedSchema = z
  .object({ decision: z.literal('rejected'), rejectionReason: z.string().trim().min(1) })
  .strict()

export const reviewDocumentVersionSchema = z.discriminatedUnion('decision', [
  approvedSchema,
  rejectedSchema,
])
