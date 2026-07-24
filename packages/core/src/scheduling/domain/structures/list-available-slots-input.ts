import type { CalendarDateRange } from './calendar-date-range'

export type ListAvailableSlotsInput = {
  readonly scheduleId: string
  readonly dateRange: CalendarDateRange
  readonly durationInMinutes: number
}
