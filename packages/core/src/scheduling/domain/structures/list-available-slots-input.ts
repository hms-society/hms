import type { CalendarDateRange } from './calendar-date-range'

export type ListAvailableSlotsInput = {
  scheduleId: string
  dateRange: CalendarDateRange
  durationInMinutes: number
}
