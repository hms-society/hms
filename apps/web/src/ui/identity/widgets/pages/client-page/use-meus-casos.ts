import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useClientDetailsQuery } from './use-client-details-query'
import { useClientIntakesQuery } from './use-client-intakes-query'

export function useMeusCasos() {
  const { user } = useAuthContext()
  const clientId = user?.id
  console.log(user?.id)

  const {
    clientDetails,
    clientDetailsError,
    isLoadingClientDetails,
  } = useClientDetailsQuery(clientId)

  const {
    clientIntakes = [],
    clientIntakesError,
    isLoadingClientIntakes,
  } = useClientIntakesQuery(clientId)

  console.log({ clientIntakes })
  console.log({clientDetails, clientDetailsError})
  const clientName = clientDetails?.client
    ? clientDetails.client.type === 'natural'
      ? clientDetails.client.name
      : clientDetails.client.legalName
    : user?.email?.split('@')[0] || 'Cliente'

  const error = clientDetailsError || clientIntakesError
  const isLoading = isLoadingClientDetails || isLoadingClientIntakes

  return {
    clientName,
    clientIntakes,
    isLoading,
    error,
  }
}
