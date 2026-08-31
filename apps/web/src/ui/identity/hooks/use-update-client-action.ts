import type { IdentityService } from '@hms/core/identity/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'



type UpdateClientRequest = {
  clientId: Parameters<IdentityService['updateClient']>[0]
  changes: any
}

export function useUpdateClientAction() {
  const queryClient = useQueryClient()
  const { identityService } = useRestContext()

  async function updateClientRequest({
    clientId,
    changes,
  }: UpdateClientRequest) {
    const response = await identityService.updateClient(clientId, changes)

    if (response.isFailure) response.throwError()

    return response.body
  }

  function invalidateClientData(_data: any, variables: UpdateClientRequest) {
    void queryClient.invalidateQueries({ queryKey: ['clients'] })
    void queryClient.invalidateQueries({ queryKey: ['identity', 'client', variables.clientId] })
  }

  const {
    mutateAsync: updateClient,
    isPending: isUpdatingClient,
    error: updateClientError,
  } = useMutation({
    mutationFn: updateClientRequest,
    onSuccess: invalidateClientData,
  })

  return {
    updateClientError,
    isUpdatingClient,
    updateClient,
  }
}
