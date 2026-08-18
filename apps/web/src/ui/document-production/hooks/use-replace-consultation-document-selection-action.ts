import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { consultationDocumentQueryKeys } from './consultation-document-query-keys'

export function useReplaceConsultationDocumentSelectionAction(consultationId?: string) {
  const { consultationDocumentProductionService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (documentSpecificationIds: readonly string[]) => {
      const response =
        await consultationDocumentProductionService.replaceDocumentSelection(
          consultationId as string,
          documentSpecificationIds,
        )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: (selection) => {
      queryClient.setQueryData(
        consultationDocumentQueryKeys.selection(consultationId ?? ''),
        selection,
      )
      void queryClient.invalidateQueries({
        queryKey: consultationDocumentQueryKeys.list(consultationId ?? ''),
      })
    },
  })

  return {
    replaceSelection: mutation.mutateAsync,
    isReplacing: mutation.isPending,
    error: mutation.error,
  }
}
