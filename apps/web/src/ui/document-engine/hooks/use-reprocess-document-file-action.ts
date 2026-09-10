import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { UnauthorizedError } from '@hms/core/shared/domain/errors'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useReprocessDocumentFileAction = (documentFileId: string) => {
  const { documentValidationService } = useRestContext()
  const queryClient = useQueryClient()
  const {
    error: reprocessDocumentError,
    isPending: isReprocessingDocument,
    mutateAsync: reprocessDocument,
  } = useMutation({
    mutationFn: async () => {
      const response = await documentValidationService.reprocess(documentFileId)

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: async (document) => {
      queryClient.setQueryData(
        ['document-validation', 'documents', documentFileId],
        document,
      )
      await queryClient.invalidateQueries({
        queryKey: ['document-validation', 'documents'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['document-batches', 'triage'],
      })
      toast.success('Reprocessamento iniciado.')
    },
    onError: (error) => {
      if (error instanceof UnauthorizedError) {
        toast.error('Sua sessão expirou. Entre novamente para reprocessar o documento.')
        return
      }

      toast.error('Não foi possível iniciar o reprocessamento do documento.')
    },
  })

  return { reprocessDocument, reprocessDocumentError, isReprocessingDocument }
}
