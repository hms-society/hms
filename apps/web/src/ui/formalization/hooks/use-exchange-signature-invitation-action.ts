import { useCallback, useState } from 'react'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useExchangeSignatureInvitationAction = () => {
  const { signingGatewayService } = useRestContext()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string>()

  const execute = useCallback(
    async (token: string) => {
      setIsPending(true)
      setError(undefined)
      const response = await signingGatewayService.exchangeInvitation({ token })
      setIsPending(false)
      if (response.isFailure) setError(response.errorMessage)
      return response
    },
    [signingGatewayService],
  )

  const reset = useCallback(() => {
    setError(undefined)
  }, [])

  return { error, execute, isPending, reset }
}
