import { z } from 'zod'

const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
})

export const authSessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
  sessionId: z.string().optional(),
  user: authUserSchema,
})
