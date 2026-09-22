import { z } from 'zod'

export const editAssistedMessageSchema = z.object({
  subject: z.string().trim().min(1),
  body: z.string().trim().min(1),
})
