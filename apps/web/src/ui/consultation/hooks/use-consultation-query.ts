import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useConsultationQuery(consultationId?: string) {
  const { consultationService, identityService } = useRestContext()

  const consultationQuery = useQuery({
    queryKey: ['consultation', consultationId],
    queryFn: async function fetchConsultation() {
      if (!consultationId) return null

      const response = await consultationService.getConsultationById(consultationId)
      if (response.isFailure) response.throwError()

      return response.body
    },
    enabled: Boolean(consultationId),
  })

  const consultation = consultationQuery.data
  const responsibleId = (consultation as any)?.intake?.responsibleId

  const responsibleQuery = useQuery({
    queryKey: ['collaborator', responsibleId],
    queryFn: async function fetchResponsible() {
      if (!responsibleId) return null

      const response = await identityService.getCollaborator(responsibleId)
      if (response.isFailure) return null

      return response.body
    },
    enabled: Boolean(responsibleId) && !(consultation as any)?.responsible,
  })

  return {
    consultation,
    isLoading: consultationQuery.isLoading,
    isError: consultationQuery.isError,
    error: consultationQuery.error,
    responsible: (consultation as any)?.responsible ?? responsibleQuery.data,
  }
}
