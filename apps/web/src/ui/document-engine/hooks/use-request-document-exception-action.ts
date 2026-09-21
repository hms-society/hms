import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

type RequestDocumentExceptionPayload = {
  documentId: string
  type: string
  justification: string
  deadlineDate?: Date
}

export const useRequestDocumentExceptionAction = (caseId: string) => {
  const { documentService } = useRestContext()
  const queryClient = useQueryClient()

  const {
    error: requestExceptionError,
    isPending: isRequestingException,
    mutateAsync: requestException,
  } = useMutation({
    mutationFn: async (payload: RequestDocumentExceptionPayload) => {
      const response = await documentService.requestException(caseId, payload)

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['case-management', 'cases', caseId],
      })
      await queryClient.invalidateQueries({
        queryKey: ['document-engine', 'case', caseId, 'document-exceptions'],
      })
      toast.success('Solicitação de exceção encaminhada com sucesso.')
    },
    onError: () => {
      toast.error('Ocorreu um erro ao solicitar a exceção documental.')
    },
  })

  return { requestException, requestExceptionError, isRequestingException }
}
