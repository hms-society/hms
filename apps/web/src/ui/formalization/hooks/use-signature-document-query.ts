import { useCallback, useEffect, useRef, useState } from 'react'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useSignatureDocumentQuery = (
  requestDocumentId: string | undefined,
  enabled: boolean,
) => {
  const { signingGatewayService } = useRestContext()
  const [content, setContent] = useState<ArrayBuffer | null>(null)
  const [error, setError] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const requestSequence = useRef(0)

  const refetch = useCallback(
    async function refetch() {
      const sequence = ++requestSequence.current
      setContent(null)
      setError(undefined)
      setIsLoading(true)
      if (!requestDocumentId) {
        setIsLoading(false)
        return
      }
      const contentResponse =
        await signingGatewayService.getDocumentContent(requestDocumentId)
      if (sequence !== requestSequence.current) return
      setIsLoading(false)
      if (contentResponse.isFailure) {
        setError(contentResponse.errorMessage)
        return
      }
      setError(undefined)
      setContent(contentResponse.body)
    },
    [requestDocumentId, signingGatewayService],
  )

  useEffect(() => {
    if (enabled) void refetch()
    return () => {
      requestSequence.current += 1
    }
  }, [enabled, refetch])

  return { content, error, isFetching: isLoading, isLoading, refetch }
}
