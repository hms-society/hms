import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import type { SendCommunicationPayload } from '@/rest/services/communication-service'

export const useSendCommunicationMutation = () => {
  const { communicationService } = useRestContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SendCommunicationPayload) => {
      const response: any = await communicationService.sendCommunication(payload)

      if (response?.isFailure) {
        response.throwError()
      }

      return response?.body ?? response?.data ?? response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['communications', 'client', variables.clientId],
      })
    },
  })
}
