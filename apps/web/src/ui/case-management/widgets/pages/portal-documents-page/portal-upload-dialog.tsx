import { useEffect, useId, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf']
const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg', 'application/pdf']

type PortalUploadDialogProps = {
  item: CaseChecklistItem | null
  open: boolean
  isUploading: boolean
  protocol?: string
  error?: string
  onOpenChange: (open: boolean) => void
  onSubmit: (file: File) => Promise<void>
}

function validateFile(file: File) {
  const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`

  if (!ACCEPTED_EXTENSIONS.includes(extension) || !ACCEPTED_MIME_TYPES.includes(file.type)) {
    return 'Formato inválido. Envie PNG, JPG, JPEG ou PDF.'
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return 'O arquivo deve ter entre 1 byte e 10 MB.'
  }

  return undefined
}

export function PortalUploadDialog({
  item,
  open,
  isUploading,
  protocol,
  error,
  onOpenChange,
  onSubmit,
}: PortalUploadDialogProps) {
  const inputId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string>()

  useEffect(() => {
    if (!open) {
      setFile(null)
      setValidationError(undefined)
    }
  }, [open])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0]
    if (!nextFile) return

    const nextError = validateFile(nextFile)
    setValidationError(nextError)
    setFile(nextError ? null : nextFile)
  }

  async function handleSubmit() {
    if (!file) {
      setValidationError('Selecione um arquivo para enviar.')
      return
    }

    await onSubmit(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] gap-0 overflow-y-auto overflow-x-hidden rounded-2xl p-0 sm:w-[calc(100%-2rem)] sm:max-w-lg'>
        <DialogHeader className='border-b border-border px-5 py-5 sm:px-6'>
          <DialogTitle className='font-serif text-xl font-semibold text-brand'>
            Enviar documento
          </DialogTitle>
          <DialogDescription className='font-sans text-sm text-muted-foreground'>
            {item?.title ?? 'Pendência documental'}
          </DialogDescription>
        </DialogHeader>

        {protocol ? (
          <div className='px-6 py-8 text-center'>
            <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-badge-success'>
              <Icon name='check-circle-2' className='size-6 text-badge-success-foreground' />
            </div>
            <h3 className='mt-4 font-serif text-xl font-semibold text-brand'>
              Documento recebido
            </h3>
            <p className='mt-2 font-sans text-sm text-muted-foreground'>
              O documento foi encaminhado para análise.
            </p>
            <p className='mt-5 font-sans text-sm text-foreground'>
              Protocolo:{' '}
              <strong className='font-mono text-primary'>{protocol}</strong>
            </p>
            <Button type='button' variant='brand' className='mt-6 rounded-pill px-6' onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <div className='px-5 py-6 sm:px-6'>
              <label
                htmlFor={inputId}
                className='flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-secondary/40 px-4 py-8 text-center transition-colors hover:border-primary hover:bg-highlight/40 focus-within:ring-3 focus-within:ring-ring/50 sm:min-h-56 sm:px-6 sm:py-10'
              >
              <Icon name='arrow-up' className='size-8 text-primary' />
                <span className='mt-3 font-sans text-sm font-semibold text-foreground'>
                  {file ? file.name : 'Escolha um arquivo para enviar'}
                </span>
                <span className='mt-1 font-sans text-xs text-muted-foreground'>
                  Clique aqui para selecionar o documento
                </span>
                <input
                  id={inputId}
                  type='file'
                  className='sr-only'
                  accept={ACCEPTED_EXTENSIONS.join(',')}
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>

              {(validationError || error) && (
                <p className='font-sans text-sm text-destructive' role='alert'>
                  {validationError ?? error}
                </p>
              )}
            </div>

            <DialogFooter className='mx-0 mb-0 flex-col gap-3 rounded-b-xl px-5 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-6'>
              <DialogClose asChild>
                <Button type='button' variant='outline' className='w-full rounded-pill px-6 sm:w-auto'>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type='button'
                variant='brand'
                className='w-full rounded-pill px-6 sm:w-auto'
                onClick={() => void handleSubmit()}
                disabled={isUploading}
              >
                {isUploading ? 'Enviando...' : 'Enviar documento'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
