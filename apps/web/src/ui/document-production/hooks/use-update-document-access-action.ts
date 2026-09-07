import { useMutation } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

type UpdateAccessRequest = {
  documentId: string
  classificacaoAcesso: string
}

export function useUpdateDocumentAccessAction() {
  const rest = useRestContext()

  const mutation = useMutation({
    mutationFn: async (request: UpdateAccessRequest) => {
      return rest.documentProductionService.updateDocumentAccess(request)
    },
  })

  return {
    updateDocumentAccess: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  }
}
