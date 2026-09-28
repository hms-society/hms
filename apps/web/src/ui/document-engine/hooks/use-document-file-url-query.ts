import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useDocumentFileUrlQuery(fileId?: string) {
  const { documentService } = useRestContext()
  const {
    data: fileUrl,
    error: fileUrlError,
    isLoading: isLoadingFileUrl,
    isError: isErrorFileUrl,
  } = useQuery({
    queryKey: ['document-file-url', fileId],
    queryFn: async () => {
      if (!fileId) return null

      const response = await documentService.getDocumentFileContent(fileId)
      if (response.isFailure) response.throwError()

      return URL.createObjectURL(response.body)
    },
    enabled: Boolean(fileId),
    retry: false,
  })

  return { fileUrl, fileUrlError, isLoadingFileUrl, isErrorFileUrl }
}
