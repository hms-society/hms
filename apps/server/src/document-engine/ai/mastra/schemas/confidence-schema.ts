import { z } from 'zod'

export const confidenceSchema = z.preprocess((value) => {
  if (typeof value !== 'number') return value

  return value > 1 ? value / 100 : value
}, z.number().min(0).max(1))
