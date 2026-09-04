import { useCallback, useEffect, useState } from 'react'
import type { SignatureGatewayContextDto } from '@hms/validation/formalization'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useSigningGatewayContextQuery = (enabled: boolean) => {
  const { signingGatewayService } = useRestContext()
  const [data, setData] = useState<SignatureGatewayContextDto>()
  const [error, setError] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    const response = await signingGatewayService.getContext()
    setIsLoading(false)

    if (response.isFailure) {
      setError(response.errorMessage)
      return undefined
    }

    setError(undefined)
    setData(response.body)
    return response.body
  }, [signingGatewayService])

  useEffect(() => {
    if (enabled) void refetch()
  }, [enabled, refetch])

  return { data, error, isFetching: isLoading, isLoading, refetch }
}
