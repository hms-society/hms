import { z } from 'zod'

const isoDatetimeSchema = z.string().datetime({ offset: true })

export const documensoWebhookSchema = z.strictObject({
  id: z.string().min(1).max(255),
  event: z.string().min(1).max(128),
  createdAt: isoDatetimeSchema,
  payload: z.strictObject({
    envelopeId: z.string().min(1).max(255),
    recipientId: z.string().min(1).max(255).optional(),
    envelopeItemId: z.string().min(1).max(255).optional(),
  }),
})

export type DocumensoWebhookInput = z.infer<typeof documensoWebhookSchema>
