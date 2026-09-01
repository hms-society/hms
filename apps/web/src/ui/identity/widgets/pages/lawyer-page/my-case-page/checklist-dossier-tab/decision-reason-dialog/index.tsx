import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Textarea } from '@/ui/shadcn/textarea'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type DecisionReasonDialogProps = {
  confirmLabel: string
  description: string
  error: string | null
  isConfirming: boolean
  open: boolean
  reason: string
  title: string
  onCancel: () => void
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  onReasonChange: (value: string) => void
}

export const DecisionReasonDialog = ({
  confirmLabel,
  description,
  error,
  isConfirming,
  open,
  reason,
  title,
  onCancel,
  onConfirm,
  onOpenChange,
  onReasonChange,
}: DecisionReasonDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      showCloseButton={false}
      className='flex w-[calc(100%-2rem)] max-w-[420px] flex-col items-center gap-6 rounded-xl border border-border bg-secondary p-6 text-center shadow-2xl sm:max-w-[420px]'
    >
      <DialogHeader className='items-center gap-4 text-center'>
        <div className='flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary'>
          <Icon name='alert-circle' className='size-5' />
        </div>
        <div className='flex flex-col gap-2'>
          <DialogTitle className='font-sans text-lg font-semibold leading-normal text-foreground'>
            {title}
          </DialogTitle>
          <DialogDescription className='text-[14px] leading-6 text-muted-foreground'>
            {description}
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className='flex w-full flex-col items-start gap-2 text-left'>
        <label
          htmlFor='checklist-gate-decision-reason'
          className='flex gap-1 text-[13px] font-semibold text-foreground'
        >
          Motivo da decisão
          <span className='text-destructive'>*</span>
        </label>
        <Textarea
          id='checklist-gate-decision-reason'
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder='Descreva o motivo da decisão...'
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'checklist-gate-decision-reason-error' : undefined}
          className='min-h-[90px] resize-none rounded-[10px] border-border bg-background px-3 py-3 text-[14px]'
        />
        {error && (
          <p
            id='checklist-gate-decision-reason-error'
            className='text-[14px] font-medium text-destructive'
          >
            {error}
          </p>
        )}
      </div>

      <DialogFooter className='mx-0 mb-0 grid w-full grid-cols-1 gap-3 rounded-none border-0 bg-transparent p-0 sm:grid-cols-2'>
        <Button
          type='button'
          variant='outline'
          className='h-11 rounded-full border-primary text-[14px] font-semibold text-primary hover:bg-primary/10'
          disabled={isConfirming}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type='button'
          className='h-11 rounded-full text-[14px] font-semibold'
          disabled={isConfirming}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
