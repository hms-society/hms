import { useQuery } from '@tanstack/react-query'

import { unwrapSchedulingResponse } from '@/rest/services/scheduling-service'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import type { CalendarQueryState } from '../types'

export function useCalendarQuery(query: CalendarQueryState) {
  const { schedulingService } = useRestContext()

  return useQuery({
    queryKey: ['scheduling', 'calendar', query],
    queryFn: async function fetchCalendar() {
      const response = await schedulingService.listCalendar(query)
      return unwrapSchedulingResponse(response)
    },
  })
}
