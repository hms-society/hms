import { useCallback, useEffect, useState } from 'react'
import type { SignatureResultDto } from '@hms/validation/formalization'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useSignatureResultQuery = (enabled: boolean) => {
  const { signingGatewayService } = useRestContext()
  const [data, setData] = useState<SignatureResultDto>()
  const [error, setError] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)

  const refetch = useCallback(
    async function refetch() {
      setIsLoading(true)
      const response = await signingGatewayService.getResult()
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
    if (enabled && !data && !isLoading) void refetch()
  }, [data, enabled, isLoading, refetch])

  return { data, error, isFetching: isLoading, isLoading, refetch }
}
