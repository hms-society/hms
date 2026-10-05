import type { IdentityService } from '@hms/core/identity/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { THIRD_PARTIES_QUERY_KEY } from './use-third-parties-query'

type ThirdPartyRegistration = Parameters<IdentityService['registerThirdParty']>[0]

export function useRegisterThirdPartyAction() {
  const { identityService } = useRestContext()
  const queryClient = useQueryClient()

  async function registerThirdPartyRequest(request: ThirdPartyRegistration) {
    const response = await identityService.registerThirdParty(request)
    if (response.isFailure) response.throwError()
    return response.body
  }

  const mutation = useMutation({
    mutationFn: registerThirdPartyRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: THIRD_PARTIES_QUERY_KEY }),
  })

  return {
    registerThirdParty: mutation.mutateAsync,
    registerThirdPartyError: mutation.error,
    isRegisteringThirdParty: mutation.isPending,
  }
}
