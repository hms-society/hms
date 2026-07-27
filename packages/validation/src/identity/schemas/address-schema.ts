import { z } from 'zod'

export const addressSchema = z.object({
  street: z.string(),
  number: z.string(),
  complement: z.string().optional(),
  district: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
})
