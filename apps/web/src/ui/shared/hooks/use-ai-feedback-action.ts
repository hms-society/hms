import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import type { RegisterFeedbackPayload } from '@/rest/services/AiSuggestionsService'

export type SendFeedbackParams = {
  suggestionId: string
  payload: RegisterFeedbackPayload
  entityId?: string
}

export const useAiFeedbackAction = () => {
  const { aiSuggestionsService } = useRestContext()
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ suggestionId, payload }: SendFeedbackParams) => {
      const response = await aiSuggestionsService.sendFeedback(suggestionId, payload)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: (_, variables) => {
      if (variables.entityId) {
        queryClient.invalidateQueries({ queryKey: ['ai-suggestions', variables.entityId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] })
      }
    },
  })

  return {
    sendFeedback: mutateAsync,
    isSubmittingFeedback: isPending,
    feedbackError: error,
  }
}
