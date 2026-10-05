import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { THIRD_PARTIES_QUERY_KEY } from './use-third-parties-query'

type StatusAction = 'deactivate' | 'reactivate'

export function useUpdateThirdPartyStatusAction() {
  const { identityService } = useRestContext()
  const queryClient = useQueryClient()

  async function updateStatus({
    action,
    thirdPartyId,
  }: {
    action: StatusAction
    thirdPartyId: string
  }) {
    const response =
      action === 'deactivate'
        ? await identityService.deactivateThirdParty(thirdPartyId)
        : await identityService.reactivateThirdParty(thirdPartyId)
    if (response.isFailure) response.throwError()
    return response.body
  }

  const mutation = useMutation({
    mutationFn: updateStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: THIRD_PARTIES_QUERY_KEY }),
  })

  return {
    updateThirdPartyStatus: mutation.mutateAsync,
    updateThirdPartyStatusError: mutation.error,
    isUpdatingThirdPartyStatus: mutation.isPending,
  }
}
