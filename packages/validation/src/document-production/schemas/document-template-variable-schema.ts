import { z } from 'zod'

const technicalNameSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_]*$/, 'Use apenas snake_case começando por uma letra.')

export const documentTemplateVariableSchema = z
  .object({
    label: z.string().trim().min(1),
    technicalName: technicalNameSchema,
    description: z
      .string()
      .trim()
      .transform((value) => value || undefined)
      .optional(),
  })
  .strict()
