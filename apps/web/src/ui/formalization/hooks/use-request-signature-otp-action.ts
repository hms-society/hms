import { useState } from 'react'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useRequestSignatureOtpAction = () => {
  const { signingGatewayService } = useRestContext()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string>()

  async function execute(channelChoiceId: string) {
    setIsPending(true)
    setError(undefined)
    const response = await signingGatewayService.requestOtp({ channelChoiceId })
    setIsPending(false)
    if (response.isFailure) setError(response.errorMessage)
    return response
  }

  function reset() {
    setError(undefined)
  }

  return { error, execute, isPending, reset }
}
