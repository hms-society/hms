import { z } from 'zod'

export const startFormalizationSchema = z
  .object({
    intakeId: z.uuid(),
  })
  .strict()

export type StartFormalizationInput = z.infer<typeof startFormalizationSchema>
