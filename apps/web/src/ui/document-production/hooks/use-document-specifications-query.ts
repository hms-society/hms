import { useQuery } from '@tanstack/react-query'
import type { DocumentSpecificationListQuery } from '@hms/core/document-production/domain/structures'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useDocumentSpecificationsQuery(query: DocumentSpecificationListQuery) {
  const { documentProductionService } = useRestContext()
  return useQuery({
    queryKey: ['document-specifications', query],
    queryFn: async () => {
      const response = await documentProductionService.listDocumentSpecifications(query)
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })
}
