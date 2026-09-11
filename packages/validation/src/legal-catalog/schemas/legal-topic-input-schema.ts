import { z } from 'zod'

export const legalTopicInputSchema = z.object({
  legalAreaId: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  active: z.boolean().default(true),
})

export const legalTopicUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (input) => input.name !== undefined || input.active !== undefined,
    'Informe ao menos uma alteração.',
  )
