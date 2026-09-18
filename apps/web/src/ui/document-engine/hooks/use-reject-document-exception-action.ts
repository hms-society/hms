import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useRejectDocumentExceptionAction = (caseId: string) => {
  const { documentService } = useRestContext()
  const queryClient = useQueryClient()

  const {
    error: rejectExceptionError,
    isPending: isRejectingException,
    mutateAsync: rejectException,
  } = useMutation({
    mutationFn: async ({
      exceptionId,
      justification,
    }: {
      exceptionId: string
      justification: string
    }) => {
      const response = await documentService.rejectException(exceptionId, {
        justification,
      })
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['document-engine', 'case', caseId, 'document-exceptions'],
      })
      toast.success('Exceção documental recusada com sucesso.')
    },
    onError: () => {
      toast.error('Ocorreu um erro ao recusar a exceção documental.')
    },
  })

  return { rejectException, rejectExceptionError, isRejectingException }
}
