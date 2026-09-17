import { useState } from 'react'

export type RequestDocumentExceptionFormState = {
  documentId: string
  type: string
  justification: string
  deadlineDate?: Date
}

type UseRequestDocumentExceptionModalProps = {
  onSubmit: (data: RequestDocumentExceptionFormState) => Promise<void>
  onClose: () => void
}

export const useRequestDocumentExceptionModal = ({
  onSubmit,
  onClose,
}: UseRequestDocumentExceptionModalProps) => {
  const [documentId, setDocumentId] = useState('')
  const [type, setType] = useState('')
  const [justification, setJustification] = useState('')
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const isAceiteProvisorio = type === 'ACEITE_PROVISORIO'

  const isSubmitDisabled =
    !documentId ||
    !type ||
    !justification.trim() ||
    (isAceiteProvisorio && !deadlineDate)

  const handleSubmit = async () => {
    if (isSubmitDisabled) return

    await onSubmit({ documentId, type, justification, deadlineDate })
    handleClose()
  }

  const handleClose = () => {
    setDocumentId('')
    setType('')
    setJustification('')
    setDeadlineDate(undefined)
    setIsCalendarOpen(false)
    onClose()
  }

  return {
    documentId,
    setDocumentId,
    type,
    setType,
    justification,
    setJustification,
    deadlineDate,
    setDeadlineDate,
    isCalendarOpen,
    setIsCalendarOpen,
    isAceiteProvisorio,
    isSubmitDisabled,
    handleSubmit,
    handleClose,
  }
}
