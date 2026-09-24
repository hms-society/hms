import { z } from 'zod'

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'not_ready']),
  version: z.string(),
  timestamp: z.iso.datetime(),
  services: z.object({
    database: z.enum(['UP', 'DOWN']),
    'supabase-auth': z.enum(['UP', 'DOWN']),
    'supabase-storage': z.enum(['UP', 'DOWN']),
    inngest: z.enum(['UP', 'DOWN', 'NOT_CONFIGURED']),
    documenso: z.enum(['UP', 'DOWN', 'DEGRADED', 'NOT_CONFIGURED']),
  }),
})
