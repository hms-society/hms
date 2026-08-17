import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { consultationDocumentQueryKeys } from './consultation-document-query-keys'

export function useCancelConsultationDocumentGenerationAction(consultationId?: string) {
  const { consultationDocumentProductionService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response =
        await consultationDocumentProductionService.cancelDocumentGeneration(
          consultationId as string,
          documentId,
        )
      if (response.isFailure) response.throwError()
      return response
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: consultationDocumentQueryKeys.list(consultationId ?? ''),
      }),
  })

  return {
    cancelDocumentGeneration: mutation.mutateAsync,
    error: mutation.error,
    isCancellingDocument: mutation.isPending,
  }
}
