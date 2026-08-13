import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useAiSuggestionsQuery(entityId: string) {
  const { aiSuggestionsService } = useRestContext()

  const {
    data: aiSuggestions = [],
    error: aiSuggestionsError,
    isLoading: isLoadingAiSuggestions,
    refetch: refetchAiSuggestions,
  } = useQuery({
    queryKey: ['ai-suggestions', entityId],
    queryFn: async () => {
      const response = await aiSuggestionsService.getAiSuggestions(entityId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: !!entityId,
  })

  return {
    aiSuggestions,
    aiSuggestionsError,
    isLoadingAiSuggestions,
    refetchAiSuggestions,
  }
}
