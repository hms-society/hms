import { z } from 'zod'

import {
  calendarDateSchema,
  calendarEventFilterSchema,
  calendarViewSchema,
} from './calendar-query-schema'

const uuidSchema = z.string().uuid()

export const calendarSearchSchema = z.strictObject({
  view: calendarViewSchema.default('week'),
  date: calendarDateSchema.optional(),
  clientId: uuidSchema.optional(),
  lawyerId: uuidSchema.optional(),
  event: calendarEventFilterSchema.default('all'),
})

export type CalendarSearchInput = z.input<typeof calendarSearchSchema>
export type CalendarSearch = z.output<typeof calendarSearchSchema>
