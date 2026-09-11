import { z } from 'zod'

export const legalAreaInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  active: z.boolean().default(true),
})

export const legalAreaUpdateSchema = legalAreaInputSchema
  .partial()
  .refine(
    (input) => input.name !== undefined || input.active !== undefined,
    'Informe ao menos uma alteração.',
  )
