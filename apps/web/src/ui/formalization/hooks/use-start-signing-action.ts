import { useState } from 'react'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useStartSigningAction = () => {
  const { signingGatewayService } = useRestContext()
  const [isPending, setIsPending] = useState(false)

  async function execute(expectedRequestVersion: number) {
    setIsPending(true)
    try {
      return await signingGatewayService.startSigning({ expectedRequestVersion })
    } finally {
      setIsPending(false)
    }
  }

  return { execute, isPending }
}
