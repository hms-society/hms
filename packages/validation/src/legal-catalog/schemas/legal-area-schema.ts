import { z } from 'zod'

export const legalAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const legalAreasSchema = z.array(legalAreaSchema)
