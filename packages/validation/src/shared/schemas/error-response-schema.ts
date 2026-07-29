import { z } from 'zod'

export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  title: z.string(),
  message: z.string(),
  timestamp: z.iso.datetime(),
  path: z.string(),
})
