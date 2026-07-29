import type { TimeRange } from './time-range'
import type { Weekday } from './weekday'

export type WeeklyAvailability = {
  readonly weekday: Weekday
  readonly timeRanges: readonly TimeRange[]
}
