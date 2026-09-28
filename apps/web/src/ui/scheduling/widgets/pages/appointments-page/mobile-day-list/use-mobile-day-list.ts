import { useMemo } from 'react'

import { getLocalDate, getMonthDays, getWeekDays } from '@/ui/scheduling/date-utils'
import type { CalendarEventView } from '@/ui/scheduling/types'

export function useMobileDayList(
  view: 'week' | 'month',
  date: string,
  events: CalendarEventView[],
) {
  const days = view === 'week' ? getWeekDays(date) : getMonthDays(date)
  const groups = useMemo(
    () =>
      days.map((day) => ({
        day,
        events: events
          .filter((event) =>
            event.kind === 'block'
              ? day >= event.startsOn && day <= event.endsOn
              : getLocalDate(event.startsAt, event.timeZone) === day,
          )
          .sort((left, right) => {
            if (left.kind === 'block') return -1
            if (right.kind === 'block') return 1
            return left.startsAt.localeCompare(right.startsAt)
          }),
      })),
    [days, events],
  )
  return groups
}
