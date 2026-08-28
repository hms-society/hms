import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Textarea } from '@/ui/shadcn/textarea'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type RejectDocumentVersionDialogProps = {
  open: boolean
  reason: string
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onReasonChange: (reason: string) => void
  onConfirm: () => void
}

export const RejectDocumentVersionDialog = ({
  open,
  reason,
  isSubmitting,
  onOpenChange,
  onReasonChange,
  onConfirm,
}: RejectDocumentVersionDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className='gap-0 overflow-hidden p-0  [&>[data-slot=dialog-close]]:top-3 [&>[data-slot=dialog-close]]:right-3 [&>[data-slot=dialog-close]]:size-8 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:bg-secondary [&>[data-slot=dialog-close]]:hover:bg-secondary/80'>
      <DialogHeader className='gap-0 border-b px-4 py-4 pr-12'>
        <DialogTitle className='font-serif text-base leading-tight font-semibold'>
          Rejeitar versão
        </DialogTitle>
      </DialogHeader>
      <div className='space-y-3.5 px-4 py-4'>
        <DialogDescription className='text-xs leading-relaxed text-foreground'>
          Esta versão permanecerá no histórico como rejeitada. Se não houver outra versão
          vigente, o documento será considerado resolvido sem uso.
        </DialogDescription>
        <div className='space-y-1'>
          <label htmlFor='rejection-reason' className='block text-md font-medium'>
            Motivo da rejeição <span aria-hidden='true'>*</span>
          </label>
          <Textarea
            id='rejection-reason'
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder='Informe o motivo'
            aria-invalid={reason.length > 0 && reason.trim().length === 0}
            className='min-h-24 resize-none rounded-md px-2.5 py-2 text-md leading-normal'
          />
          {reason.length > 0 && reason.trim().length === 0 ? (
            <p className='text-[0.7rem] text-destructive'>
              Informe ao menos um caractere.
            </p>
          ) : (
            <p className='text-[0.7rem] text-muted-foreground'>
              O motivo ficará registrado no histórico.
            </p>
          )}
        </div>
      </div>
      <DialogFooter className='mx-0 mb-0 gap-2 rounded-b-xl px-4 py-3'>
        <Button
          type='button'
          variant='outline'
          className='rounded-full border-primary px-4 text-sm text-primary hover:bg-highlight'
          disabled={isSubmitting}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button
          type='button'
          variant='destructive'
          className='rounded-full bg-destructive px-4 text-sm text-destructive-foreground hover:bg-destructive/80'
          disabled={isSubmitting || reason.trim().length === 0}
          onClick={onConfirm}
        >
          <Icon name='x' /> {isSubmitting ? 'Rejeitando…' : 'Rejeitar versão'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
