import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrapSchedulingResponse } from '@/rest/services/scheduling-service'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useAppointmentActions() {
  const { schedulingService } = useRestContext()
  const queryClient = useQueryClient()

  const cancelMutation = useMutation({
    mutationFn: async (input: { appointmentId: string; expectedRevision: string }) => {
      const response = await schedulingService.cancelAppointment(
        input.appointmentId,
        input.expectedRevision,
      )
      return unwrapSchedulingResponse(response)
    },
    onSuccess: (_details, input) => {
      void queryClient.invalidateQueries({ queryKey: ['scheduling', 'calendar'] })
      void queryClient.invalidateQueries({
        queryKey: ['scheduling', 'appointment-details', input.appointmentId],
      })
    },
  })

  const rescheduleMutation = useMutation({
    mutationFn: async (input: {
      appointmentId: string
      expectedRevision: string
      startsAt: string
      lawyerId: string
    }) => {
      const response = await schedulingService.rescheduleAppointment(
        input.appointmentId,
        input.expectedRevision,
        input.startsAt,
        input.lawyerId,
      )
      return unwrapSchedulingResponse(response)
    },
    onSuccess: (_details, input) => {
      void queryClient.invalidateQueries({ queryKey: ['scheduling', 'calendar'] })
      void queryClient.invalidateQueries({
        queryKey: ['scheduling', 'appointment-details', input.appointmentId],
      })
      void queryClient.invalidateQueries({
        queryKey: ['scheduling', 'reschedule-slots', input.appointmentId],
      })
    },
  })

  return {
    cancelAppointment: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    cancelError: cancelMutation.error,
    rescheduleAppointment: rescheduleMutation.mutateAsync,
    isRescheduling: rescheduleMutation.isPending,
    rescheduleError: rescheduleMutation.error,
  }
}
