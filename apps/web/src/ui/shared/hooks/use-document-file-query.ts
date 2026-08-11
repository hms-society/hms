import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useDocumentFileQuery(fileId: string) {
  const { documentService } = useRestContext()

  return useQuery({
    queryKey: ['document-file', fileId],
    queryFn: async () => {
      const response = await documentService.getDocumentFile(fileId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: !!fileId,
  })
}
