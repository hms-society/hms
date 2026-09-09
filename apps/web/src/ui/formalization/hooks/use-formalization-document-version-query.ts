import type { DocumentVersion } from '@hms/core/document-production/domain/entities'
import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function getFormalizationDocumentVersionQueryKey(
  formalizationId: string,
  documentVersionId: string,
) {
  return [
    'formalization',
    'detail',
    formalizationId,
    'version',
    documentVersionId,
  ] as const
}

export function useFormalizationDocumentVersionQuery(
  formalizationId?: string,
  documentVersionId?: string,
) {
  const { formalizationService } = useRestContext()
  const query = useQuery({
    queryKey: getFormalizationDocumentVersionQueryKey(
      formalizationId ?? '',
      documentVersionId ?? '',
    ),
    enabled: Boolean(formalizationId && documentVersionId),
    retry: false,
    queryFn: async function getFormalizationDocumentVersion() {
      const response = await formalizationService.getVersion(
        formalizationId as string,
        documentVersionId as string,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
  })

  return {
    documentVersion: query.data as DocumentVersion | undefined,
    documentVersionError: query.error,
    isErrorDocumentVersion: query.isError,
    isFetchingDocumentVersion: query.isFetching,
    isLoadingDocumentVersion: query.isLoading,
    isSuccessDocumentVersion: query.isSuccess,
    refetchDocumentVersion: query.refetch,
  }
}
