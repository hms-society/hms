import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useConsultationStatusActions = () => {
  const { consultationService } = useRestContext()
  const queryClient = useQueryClient()

  const markNoShowMutation = useMutation({
    mutationFn: async function markNoShow(id: string) {
      const response = await consultationService.markNoShow(id)
      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: function invalidateNoShowConsultation(_data, id: string) {
      void queryClient.invalidateQueries({ queryKey: ['consultation', id] })
    },
  })

  const rescheduleMutation = useMutation({
    mutationFn: async function rescheduleConsultation(id: string) {
      const response = await consultationService.rescheduleConsultation(id)
      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: function invalidateRescheduledConsultation(_data, id: string) {
      void queryClient.invalidateQueries({ queryKey: ['consultation', id] })
    },
  })

  return {
    markNoShow: markNoShowMutation.mutateAsync,
    isMarkingNoShow: markNoShowMutation.isPending,
    rescheduleConsultation: rescheduleMutation.mutateAsync,
    isRescheduling: rescheduleMutation.isPending,
  }
}
