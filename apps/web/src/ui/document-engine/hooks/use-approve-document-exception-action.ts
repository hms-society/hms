import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useApproveDocumentExceptionAction = (caseId: string) => {
  const { documentService } = useRestContext()
  const queryClient = useQueryClient()

  const {
    error: approveExceptionError,
    isPending: isApprovingException,
    mutateAsync: approveException,
  } = useMutation({
    mutationFn: async (exceptionId: string) => {
      const response = await documentService.approveException(exceptionId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['document-engine', 'case', caseId, 'document-exceptions'],
      })
      toast.success('Exceção documental aprovada com sucesso.')
    },
    onError: () => {
      toast.error('Ocorreu um erro ao aprovar a exceção documental.')
    },
  })

  return { approveException, approveExceptionError, isApprovingException }
}
