import { useEffect, useId, useState } from 'react'
import type { ChangeEvent } from 'react'

import type { PortalUploadDialogProps } from './portal-upload-dialog.types'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf']
const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg', 'application/pdf']

export function usePortalUploadDialog({ open, onSubmit }: PortalUploadDialogProps) {
  const inputId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string>()

  useEffect(() => {
    if (!open) {
      setFile(null)
      setValidationError(undefined)
    }
  }, [open])

  function validateFile(nextFile: File) {
    const extension = `.${nextFile.name.split('.').pop()?.toLowerCase() ?? ''}`

    if (
      !ACCEPTED_EXTENSIONS.includes(extension) ||
      !ACCEPTED_MIME_TYPES.includes(nextFile.type)
    ) {
      return 'Formato inválido. Envie PNG, JPG, JPEG ou PDF.'
    }

    if (nextFile.size <= 0 || nextFile.size > MAX_FILE_SIZE_BYTES) {
      return 'O arquivo deve ter entre 1 byte e 10 MB.'
    }

    return undefined
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0]
    if (!nextFile) return

    const nextError = validateFile(nextFile)
    setValidationError(nextError)
    setFile(nextError ? null : nextFile)
  }

  async function handleSubmit() {
    if (!file) {
      if (!validationError) {
        setValidationError('Selecione um arquivo para enviar.')
      }
      return
    }

    await onSubmit(file)
  }

  return {
    acceptedExtensions: ACCEPTED_EXTENSIONS.join(','),
    file,
    inputId,
    validationError,
    handleFileChange,
    handleSubmit,
  }
}
