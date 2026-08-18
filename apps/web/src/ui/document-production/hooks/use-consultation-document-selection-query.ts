import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { consultationDocumentQueryKeys } from './consultation-document-query-keys'

export function useConsultationDocumentSelectionQuery(consultationId?: string) {
  const { consultationDocumentProductionService } = useRestContext()

  return useQuery({
    queryKey: consultationDocumentQueryKeys.selection(consultationId ?? ''),
    queryFn: async () => {
      const response = await consultationDocumentProductionService.getDocumentSelection(
        consultationId as string,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(consultationId),
    retry: false,
  })
}
