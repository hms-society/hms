import { useState } from 'react'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useCloseSignatureResultAction = () => {
  const { signingGatewayService } = useRestContext()
  const [isPending, setIsPending] = useState(false)

  async function execute() {
    setIsPending(true)
    const response = await signingGatewayService.closeResult()
    setIsPending(false)
    return response
  }

  return { execute, isPending }
}
