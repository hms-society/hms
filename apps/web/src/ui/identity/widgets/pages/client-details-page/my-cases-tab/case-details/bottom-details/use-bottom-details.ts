import { toast } from 'sonner'

import { useCaseDetails } from '../use-case-details'

export function useBottomDetails() {
  const details = useCaseDetails()

  function handleUploadError() {
    toast.error('Houve um erro ao enviar o documento. Tente novamente mais tarde.')
  }

  return { ...details, handleUploadError }
}
