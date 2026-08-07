import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useConsultation(consultationId?: string) {
  const { consultationService } = useRestContext()
  const queryClient = useQueryClient()

 const {
  data: consultation,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ['consultation', consultationId],
  queryFn: async () => {
    if (!consultationId) return null
    const response = await consultationService.getConsultationById(consultationId)
    if (response.isFailure) response.throwError()
    console.log('consultation raw:', JSON.stringify(response.body, null, 2))
    return response.body
  },
  enabled: Boolean(consultationId),
})

  
  const startConsultationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await consultationService.startConsultation(id)

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['consultation', id] })
    },
  })

  const markNoShowMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await consultationService.markNoShow(id)

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['consultation', id] })
    },
  })


  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, newDate }: { id: string; newDate: string }) => {
      const response = await consultationService.rescheduleConsultation(id, newDate)

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['consultation', variables.id] })
    },
  })

  return {
    consultation,
    isLoading,
    isError,
    error,
    startConsultation: startConsultationMutation.mutateAsync,
    isStarting: startConsultationMutation.isPending,
    markNoShow: markNoShowMutation.mutateAsync,
    isMarkingNoShow: markNoShowMutation.isPending,
    rescheduleConsultation: rescheduleMutation.mutateAsync,
    isRescheduling: rescheduleMutation.isPending,
  }
}