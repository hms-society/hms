import { useCallback, useEffect, useState } from 'react'
import type { SignatureGatewayChannelsDto } from '@hms/validation/formalization'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useSignatureChannelsQuery = (enabled: boolean) => {
  const { signingGatewayService } = useRestContext()
  const [data, setData] = useState<SignatureGatewayChannelsDto>()
  const [error, setError] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)

  const refetch = useCallback(
    async function refetch() {
      setIsLoading(true)
      const response = await signingGatewayService.listChannels()
      setIsLoading(false)
      if (response.isFailure) {
        setError(response.errorMessage)
        return undefined
      }
      setError(undefined)
      setData(response.body)
      return response.body
    },
    [signingGatewayService],
  )

  useEffect(() => {
    if (enabled) void refetch()
  }, [enabled, refetch])

  return { data, error, isFetching: isLoading, isLoading, refetch }
}
