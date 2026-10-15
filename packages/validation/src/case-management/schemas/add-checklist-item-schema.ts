import { z } from 'zod'

export const addChecklistItemFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Informe o nome do item.'),
    isRequired: z.boolean().default(true),
  })
  .strict()

export const addChecklistItemSchema = addChecklistItemFormSchema
  .extend({ templateItemKey: z.string().trim().min(1) })
  .strict()
