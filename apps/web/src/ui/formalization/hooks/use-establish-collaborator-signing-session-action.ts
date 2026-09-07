import { useCallback, useState } from 'react'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useEstablishCollaboratorSigningSessionAction = () => {
  const { signingGatewayService } = useRestContext()
  const [isPending, setIsPending] = useState(false)

  const execute = useCallback(
    async function execute() {
      setIsPending(true)
      try {
        return await signingGatewayService.establishCollaboratorSession()
      } finally {
        setIsPending(false)
      }
    },
    [signingGatewayService],
  )

  return { execute, isPending }
}
