import { useState } from 'react'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useAcknowledgeSignatureDocumentAction = () => {
  const { signingGatewayService } = useRestContext()
  const [isPending, setIsPending] = useState(false)

  async function execute(input: {
    requestDocumentId: string
    expectedRequestVersion: number
  }) {
    setIsPending(true)
    try {
      return await signingGatewayService.acknowledgeDocument(input.requestDocumentId, {
        expectedRequestVersion: input.expectedRequestVersion,
        acknowledged: true,
      })
    } finally {
      setIsPending(false)
    }
  }

  return { execute, isPending }
}
