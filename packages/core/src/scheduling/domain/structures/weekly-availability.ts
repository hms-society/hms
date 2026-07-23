import type { TimeRange } from './time-range'
import type { Weekday } from './weekday'

export type WeeklyAvailability = {
  weekday: Weekday
  timeRanges: TimeRange[]
}
