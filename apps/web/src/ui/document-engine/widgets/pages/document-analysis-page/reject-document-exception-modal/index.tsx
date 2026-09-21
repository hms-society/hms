import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Textarea } from '@/ui/shadcn/textarea'

import { useRejectDocumentExceptionModal } from './use-reject-document-exception-modal'

export type RejectDocumentExceptionModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (justification: string) => Promise<any>
  isLoading?: boolean
}

const RequiredMark = () => <span className='ml-1 text-red-500'>*</span>

export const RejectDocumentExceptionModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: RejectDocumentExceptionModalProps) => {
  const { justification, setJustification, isSubmitDisabled, handleSubmit, handleClose } =
    useRejectDocumentExceptionModal({ onSubmit, onClose })

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='w-[calc(100%-2rem)] !max-w-lg gap-0 p-0 bg-white overflow-hidden sm:rounded-2xl'>
        <DialogHeader className='flex flex-row items-start justify-between border-b border-border px-5 py-4'>
          <div className='flex flex-col gap-0.5'>
            <DialogTitle className='font-serif text-xl font-bold text-foreground'>
              Recusar exceção
            </DialogTitle>
            <DialogDescription className='font-sans text-xs text-muted-foreground'>
              Informe o motivo da recusa desta exceção documental.
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className='flex flex-col gap-4 px-5 py-4'>
          <div className='flex flex-col gap-2'>
            <span className='font-sans text-sm font-semibold text-foreground'>
              Justificativa
              <RequiredMark />
            </span>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder='Descreva o motivo da recusa...'
              className='min-h-[120px] resize-none rounded-xl border-border bg-white p-3 font-sans text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary'
            />
          </div>
        </div>
        <div className='flex items-center justify-end gap-3 border-t border-border bg-[#F8F9FA] px-5 py-4'>
          <Button
            variant='outline'
            className='h-10 rounded-full border-border bg-transparent font-sans text-sm font-semibold text-foreground hover:bg-muted'
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            variant='destructive'
            className='h-10 rounded-full font-sans text-sm font-semibold'
            disabled={isSubmitDisabled || isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <Icon name='refresh-cw' className='size-4 animate-spin' />
            ) : (
              'Confirmar Recusa'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
