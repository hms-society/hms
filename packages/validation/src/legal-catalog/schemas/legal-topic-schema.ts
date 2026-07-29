import { z } from 'zod'

export const legalTopicSchema = z.object({
  id: z.string(),
  legalAreaId: z.string(),
  name: z.string(),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const legalTopicsSchema = z.array(legalTopicSchema)
