import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useListCaseDocumentExceptionsQuery(caseId: string) {
  const { documentService } = useRestContext()
  const {
    data: exceptions = [],
    error: exceptionsError,
    isLoading: isLoadingExceptions,
    isError: isErrorExceptions,
  } = useQuery({
    queryKey: ['document-engine', 'case', caseId, 'document-exceptions'],
    queryFn: async () => {
      const response = await documentService.listCaseExceptions(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: !!caseId,
  })

  return { exceptions, exceptionsError, isLoadingExceptions, isErrorExceptions }
}
