import type { IdentityService } from '@hms/core/identity/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { THIRD_PARTIES_QUERY_KEY } from './use-third-parties-query'

type ThirdPartyChanges = Parameters<IdentityService['updateThirdParty']>[1]

export function useUpdateThirdPartyAction() {
  const { identityService } = useRestContext()
  const queryClient = useQueryClient()

  async function updateThirdPartyRequest({
    thirdPartyId,
    changes,
  }: {
    thirdPartyId: string
    changes: ThirdPartyChanges
  }) {
    const response = await identityService.updateThirdParty(thirdPartyId, changes)
    if (response.isFailure) response.throwError()
    return response.body
  }

  const mutation = useMutation({
    mutationFn: updateThirdPartyRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: THIRD_PARTIES_QUERY_KEY }),
  })

  return {
    updateThirdParty: mutation.mutateAsync,
    updateThirdPartyError: mutation.error,
    isUpdatingThirdParty: mutation.isPending,
  }
}
