import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { RequestDocumentResendRequest } from '@hms/core/document-engine/interfaces'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useRequestDocumentResendAction = (documentFileId: string) => {
  const { documentValidationService } = useRestContext()
  const queryClient = useQueryClient()
  const {
    error: requestResendError,
    isPending: isRequestingResend,
    mutateAsync: requestResend,
  } = useMutation({
    mutationFn: async (request: RequestDocumentResendRequest) => {
      const response = await documentValidationService.requestResend(
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
      toast.success('Solicitação de reenvio encaminhada com sucesso.')
    },
    onError: () => {
      toast.error('Ocorreu um erro ao solicitar o reenvio do documento.')
    },
  })

  return { requestResend, requestResendError, isRequestingResend }
}
