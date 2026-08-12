import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import type { CompleteConsultationRequest } from '@/rest/services/consultation-service'

export function useConsultation(consultationId?: string) {
  const { consultationService, identityService } = useRestContext()
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
      return response.body
    },
    enabled: Boolean(consultationId),
  })
  const responsibleId = (consultation as any)?.intake?.responsibleId

  const { data: responsible } = useQuery({
    queryKey: ['collaborator', responsibleId],
    queryFn: async () => {
      if (!responsibleId) return null
      const response = await identityService.getCollaborator(responsibleId)
      if (response.isFailure) return null
      return response.body
    },
    enabled: !!responsibleId,
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
    mutationFn: async (data: CompleteConsultationRequest & { consultationId?: string }) => {
      const id = data.consultationId || consultationId
      if (!id) throw new Error('ID da consulta não fornecido.')

      const { consultationId: _, ...payload } = data

      const response = await consultationService.completeConsultation(id, payload)

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
    onSuccess: (_, variables) => {
      const id = variables.consultationId || consultationId
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
    responsible,
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