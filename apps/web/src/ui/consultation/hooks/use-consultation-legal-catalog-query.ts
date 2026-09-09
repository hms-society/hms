import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type ConsultationLegalAreaOption = {
  id: string
  name: string
}

export type ConsultationLegalTopicOption = {
  id: string
  name: string
}

export const useConsultationLegalCatalogQuery = (legalAreaId: string) => {
  const { legalCatalogService } = useRestContext()
  const { data: legalAreas = [] } = useQuery({
    queryKey: ['legal-areas'],
    queryFn: async () => {
      const response = await legalCatalogService.listLegalAreas()

      if (response.isFailure) return []

      return (response.body as ConsultationLegalAreaOption[]) ?? []
    },
  })
  const { data: legalTopics = [] } = useQuery({
    queryKey: ['legal-topics', legalAreaId],
    queryFn: async () => {
      if (!legalAreaId) return []

      const response = await legalCatalogService.listLegalTopics(legalAreaId)

      if (response.isFailure) return []

      return (response.body as ConsultationLegalTopicOption[]) ?? []
    },
    enabled: Boolean(legalAreaId),
  })

  return { legalAreas, legalTopics }
}
