import { useMemo } from 'react'

import { getLocalDate, getWeekDays } from '@/ui/scheduling/date-utils'
import type { CalendarEventView } from '@/ui/scheduling/types'

export function useWeekCalendar(date: string, events: CalendarEventView[]) {
  const days = getWeekDays(date)
  const eventsByDay = useMemo(
    () =>
      new Map(
        days.map((day) => [
          day,
          events
            .filter((event) =>
              event.kind === 'block'
                ? day >= event.startsOn && day <= event.endsOn
                : getLocalDate(event.startsAt, event.timeZone) === day,
            )
            .sort((left, right) => getEventTime(left) - getEventTime(right)),
        ]),
      ),
    [days, events],
  )

  return { days, eventsByDay }
}

function getEventTime(event: CalendarEventView) {
  return event.kind === 'block' ? 0 : new Date(event.startsAt).getTime()
}
