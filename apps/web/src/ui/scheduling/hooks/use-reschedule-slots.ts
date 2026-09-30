import { useQuery } from '@tanstack/react-query'

import { unwrapSchedulingResponse } from '@/rest/services/scheduling-service'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useRescheduleSlots(
  appointmentId?: string,
  date?: string,
  lawyerId?: string,
) {
  const { schedulingService } = useRestContext()

  return useQuery({
    queryKey: ['scheduling', 'reschedule-slots', appointmentId, lawyerId, date],
    enabled: Boolean(appointmentId && lawyerId && date),
    queryFn: async function fetchRescheduleSlots() {
      if (!appointmentId || !date || !lawyerId) return []
      const response = await schedulingService.listRescheduleSlots(
        appointmentId,
        date,
        lawyerId,
      )
      return unwrapSchedulingResponse(response)
    },
  })
}
