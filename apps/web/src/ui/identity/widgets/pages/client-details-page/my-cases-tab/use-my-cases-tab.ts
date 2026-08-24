import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useClientDetailsQuery } from '@/ui/identity/hooks/use-client-details-query'
import { useClientIntakesQuery } from '@/ui/identity/hooks/use-client-intakes-query'

export function useMyCasesTab() {
  const { user } = useAuthContext()
  const clientId = user?.id

  const { clientDetails, clientDetailsError, isLoadingClientDetails } =
    useClientDetailsQuery(clientId)

  const {
    clientIntakes = [],
    clientIntakesError,
    isLoadingClientIntakes,
  } = useClientIntakesQuery(clientId)

  const clientName = clientDetails?.client
    ? clientDetails.client.type === 'natural'
      ? clientDetails.client.name
      : clientDetails.client.legalName
    : user?.email?.split('@')[0] || 'Cliente'

  const error = clientDetailsError || clientIntakesError
  const isLoading = isLoadingClientDetails || isLoadingClientIntakes
  const hours = new Date().getHours()
  const greeting = hours < 12 ? 'Bom dia' : hours < 18 ? 'Boa tarde' : 'Boa noite'

  return {
    clientName,
    clientIntakes,
    greeting,
    isLoading,
    error,
  }
}
