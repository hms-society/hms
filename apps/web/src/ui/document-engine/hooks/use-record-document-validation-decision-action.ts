import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { RecordDocumentValidationDecisionRequest } from '@hms/core/document-engine/interfaces'

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
      const response = await documentValidationService.recordDecision(
        documentFileId,
        request,
      )

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['document-validation', 'documents'],
      })
      toast.success('Documento revisado com sucesso.')
    },
    onError: () => {
      toast.error('Ocorreu um erro ao processar a validação do documento.')
    },
  })

  return { recordDecision, recordDecisionError, isRecordingDecision }
}
