import { FormalizationSignatureResultStatus } from '@hms/core/formalization/domain/structures'
import { z } from 'zod'

const isoDatetimeSchema = z.string().datetime({ offset: true })

export const signatureResultSchema = z.strictObject({
  status: z.enum(FormalizationSignatureResultStatus),
  hmsReference: z.string().min(1).max(64),
  protocol: z.string().min(1).max(128).optional(),
  occurredAt: isoDatetimeSchema.optional(),
  confirmedAt: isoDatetimeSchema.optional(),
})

export type SignatureResultDto = z.infer<typeof signatureResultSchema>
