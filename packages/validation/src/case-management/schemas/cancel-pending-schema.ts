import { z } from 'zod'
export const cancelPendingSchema = z.object({ errorReason: z.string().trim().min(1) })
