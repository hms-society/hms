import { z } from 'zod'

export const startSigningSchema = z.strictObject({
  expectedRequestVersion: z.number().int().positive(),
})

export type StartSigningInput = z.infer<typeof startSigningSchema>
