import { z } from 'zod'

export const adminCasesQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(50),
  })
  .strict()

export type AdminCasesQueryData = z.infer<typeof adminCasesQuerySchema>
