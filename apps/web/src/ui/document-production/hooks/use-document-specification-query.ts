import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useDocumentSpecificationQuery = (
  documentSpecificationId: string | undefined,
  enabled: boolean,
) => {
  const { documentProductionService } = useRestContext()

  return useQuery({
    queryKey: ['document-specification', documentSpecificationId],
    enabled: enabled && Boolean(documentSpecificationId),
    queryFn: async () => {
      const response = await documentProductionService.getDocumentSpecification(
        documentSpecificationId as string,
      )

      if (response.isFailure) {
        const error = new Error(response.errorMessage)
        Object.assign(error, { statusCode: response.statusCode })
        throw error
      }

      return response.body
    },
  })
}
