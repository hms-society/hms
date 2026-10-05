import { z } from 'zod'

import { calendarDateSchema } from './calendar-query-schema'

const uuidSchema = z.string().uuid()

const optionalSearchSchema = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .pipe(z.string().max(100).optional())
  .optional()

const cursorSchema = z.string().trim().min(1).max(512).optional()

export const calendarOptionKindSchema = z.enum(['client', 'lawyer'])

export const calendarOptionsQuerySchema = z.strictObject({
  kind: calendarOptionKindSchema,
  search: optionalSearchSchema,
  cursor: cursorSchema,
})

export const rescheduleSlotsQuerySchema = z.strictObject({
  date: calendarDateSchema,
  lawyerId: uuidSchema.optional(),
})

export type CalendarOptionsQuery = z.infer<typeof calendarOptionsQuerySchema>
export type RescheduleSlotsQuery = z.infer<typeof rescheduleSlotsQuerySchema>
