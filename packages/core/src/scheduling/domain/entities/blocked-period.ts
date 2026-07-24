import type { CalendarDate } from '../structures'

export type BlockedPeriod = {
  id: string
  startsOn: CalendarDate
  /** Inclusive final calendar date. */
  endsOn: CalendarDate
  reason?: string
  createdAt: Date
}
