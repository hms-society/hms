import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { RecordDocumentValidationDecisionRequest } from '@hms/core/document-engine/interfaces'
import { UnauthorizedError } from '@hms/core/shared/domain/errors'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useRecordDocumentValidationDecisionAction = (documentFileId: string) => {
  const { documentValidationService } = useRestContext()
  const queryClient = useQueryClient()
  const {
    error: recordDecisionError,
    isPending: isRecordingDecision,
    mutateAsync: recordDecision,
  } = useMutation({
    mutationFn: async (request: RecordDocumentValidationDecisionRequest) => {
      console.log('[document-validation] record decision request', {
        documentFileId,
        request,
      })

      const response = await documentValidationService.recordDecision(
        documentFileId,
        request,
      )

      if (response.isFailure) {
        let errorMessage = 'No error message returned'

        try {
          errorMessage = response.errorMessage
        } catch {
          errorMessage = 'Response failed without an error message'
        }

        console.error('[document-validation] record decision failed response', {
          documentFileId,
          errorMessage,
          request,
          statusCode: response.statusCode,
        })
        response.throwError()
      }

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
        queryKey: ['case-management', 'cases'],
      })
      toast.success('Documento revisado com sucesso.')
    },
    onError: (error) => {
      console.error('[document-validation] record decision mutation error', {
        documentFileId,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : typeof error,
      })

      if (error instanceof UnauthorizedError) {
        toast.error('Sua sessão expirou. Entre novamente para validar o documento.')
        return
      }

      toast.error('Ocorreu um erro ao processar a validação do documento.')
    },
  })

  return { recordDecision, recordDecisionError, isRecordingDecision }
}
