import { useState } from 'react'

export type UseRejectDocumentExceptionModalProps = {
  onSubmit: (justification: string) => Promise<any>
  onClose: () => void
}

export const useRejectDocumentExceptionModal = ({
  onSubmit,
  onClose,
}: UseRejectDocumentExceptionModalProps) => {
  const [justification, setJustification] = useState('')

  const isSubmitDisabled = !justification.trim()

  const handleSubmit = async () => {
    if (isSubmitDisabled) return

    await onSubmit(justification)
    handleClose()
  }

  const handleClose = () => {
    setJustification('')
    onClose()
  }

  return {
    justification,
    setJustification,
    isSubmitDisabled,
    handleSubmit,
    handleClose,
  }
}
