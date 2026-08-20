import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useConsultationCompletionAction = (consultationId?: string) => {
  const { consultationService } = useRestContext()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async function completeConsultation() {
      if (!consultationId) throw new Error('ID da consulta não fornecido.')

      const response = await consultationService.completeConsultation(consultationId)
      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: function invalidateCompletedConsultation() {
      void queryClient.invalidateQueries({
        queryKey: ['consultation', consultationId],
      })
    },
  })

  return {
    completeConsultation: mutation.mutateAsync,
    isCompleting: mutation.isPending,
  }
}
