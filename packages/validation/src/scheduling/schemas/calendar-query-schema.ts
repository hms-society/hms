import { z } from 'zod'

const uuidSchema = z.string().uuid()

export const calendarViewSchema = z.enum(['week', 'month'])

export const calendarDateSchema = z.iso.date()

export const calendarEventFilterSchema = z.enum([
  'all',
  'scheduled',
  'cancelled',
  'no_show',
  'blocked',
])

export const calendarQuerySchema = z.strictObject({
  view: calendarViewSchema,
  date: calendarDateSchema,
  clientId: uuidSchema.optional(),
  lawyerId: uuidSchema.optional(),
  event: calendarEventFilterSchema.default('all'),
})

export type CalendarQueryInput = z.input<typeof calendarQuerySchema>
export type CalendarQuery = z.output<typeof calendarQuerySchema>
