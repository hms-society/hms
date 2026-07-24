import type { LocalTime } from './local-time'

export type TimeRange = {
  readonly startsAt: LocalTime
  readonly endsAt: LocalTime
}
