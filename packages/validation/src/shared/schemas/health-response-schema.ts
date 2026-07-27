import { z } from 'zod'

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string(),
  timestamp: z.iso.datetime(),
  services: z.object({
    database: z.literal('UP'),
    supabase: z.literal('UP'),
  }),
})
