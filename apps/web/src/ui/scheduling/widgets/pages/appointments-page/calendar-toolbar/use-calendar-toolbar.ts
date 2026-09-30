import { useMemo } from 'react'

import { formatDateLabel, getMonthDays, getWeekDays } from '@/ui/scheduling/date-utils'
import type { CalendarQueryState } from '@/ui/scheduling/types'

export type CalendarToolbarController = {
  intervalLabel: string
  monthLabel: string
}

export function useCalendarToolbar(
  view: CalendarQueryState['view'],
  date: string,
): CalendarToolbarController {
  return useMemo(() => {
    const days = view === 'week' ? getWeekDays(date) : getMonthDays(date)
    const first = days[0]
    const last = days[days.length - 1]
    return {
      intervalLabel:
        view === 'week'
          ? `${formatDateLabel(first, { day: '2-digit', month: '2-digit' })}–${formatDateLabel(last, { day: '2-digit', month: '2-digit', year: 'numeric' })}`
          : formatDateLabel(date, { month: 'long', year: 'numeric' }),
      monthLabel: formatDateLabel(date, { month: 'long', year: 'numeric' }),
    }
  }, [date, view])
}
