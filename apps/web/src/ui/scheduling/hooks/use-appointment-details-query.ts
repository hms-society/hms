import { useQuery } from '@tanstack/react-query'

import { unwrapSchedulingResponse } from '@/rest/services/scheduling-service'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useAppointmentDetailsQuery(appointmentId?: string) {
  const { schedulingService } = useRestContext()

  return useQuery({
    queryKey: ['scheduling', 'appointment-details', appointmentId],
    enabled: Boolean(appointmentId),
    queryFn: async function fetchAppointmentDetails() {
      if (!appointmentId) return null
      const response = await schedulingService.getAppointmentDetails(appointmentId)
      return unwrapSchedulingResponse(response)
    },
  })
}
