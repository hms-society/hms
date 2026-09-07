import { useState } from 'react'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useVerifySignatureOtpAction = () => {
  const { signingGatewayService } = useRestContext()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string>()

  async function execute(input: { challengeId: string; code: string }) {
    setIsPending(true)
    setError(undefined)
    const response = await signingGatewayService.verifyOtp(input)
    setIsPending(false)
    if (response.isFailure) setError(response.errorMessage)
    return response
  }

  function reset() {
    setError(undefined)
  }

  return { error, execute, isPending, reset }
}
