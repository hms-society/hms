import { useMemo } from 'react'

import {
  getLocalDate,
  getMonthDays,
  getTodayInSaoPaulo,
} from '@/ui/scheduling/date-utils'
import type { CalendarEventView } from '@/ui/scheduling/types'

export function useMonthCalendar(date: string, events: CalendarEventView[]) {
  const days = getMonthDays(date)
  const today = getTodayInSaoPaulo()
  const eventsByDay = useMemo(
    () =>
      new Map(
        days.map((day) => [
          day,
          events.filter((event) =>
            event.kind === 'block'
              ? day >= event.startsOn && day <= event.endsOn
              : getLocalDate(event.startsAt, event.timeZone) === day,
          ),
        ]),
      ),
    [days, events],
  )

  return { days, eventsByDay, today }
}
