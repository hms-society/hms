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
    mutationFn: async (id: string) => {
      const response = await consultationService.rescheduleConsultation(id)

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['consultation', id],
      })
    },
  })

  const completeConsultationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await consultationService.completeConsultation(id)

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['consultation', id],
      })
    },
  })

const updateQualificationMutation = useMutation({
  mutationFn: async (dto: any) => {
    if (!consultationId) return
    const response = await consultationService.updateQualification(consultationId, dto)
    if (response.isFailure) response.throwError()
    return response.body
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['consultation', consultationId] })
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
    completeConsultation: completeConsultationMutation.mutateAsync,
    isCompleting: completeConsultationMutation.isPending,
    updateQualification: updateQualificationMutation.mutateAsync,
    isUpdatingQualification: updateQualificationMutation.isPending,
  }
}