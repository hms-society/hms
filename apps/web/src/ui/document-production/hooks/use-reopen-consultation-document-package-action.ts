import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { consultationDocumentQueryKeys } from './consultation-document-query-keys'

export function useReopenConsultationDocumentPackageAction(consultationId?: string) {
  const { consultationDocumentProductionService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async () => {
      if (!consultationId) throw new Error('ID da consulta não fornecido.')
      const response =
        await consultationDocumentProductionService.reopenDocumentPackage(consultationId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: consultationDocumentQueryKeys.selection(consultationId ?? ''),
      })
    },
  })

  return {
    reopenDocumentPackage: mutation.mutateAsync,
    error: mutation.error,
    isReopening: mutation.isPending,
  }
}
