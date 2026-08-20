import type { IntakeClosureReason } from '@hms/core/intake/domain/structures'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Textarea } from '@/ui/shadcn/textarea'

const CLOSURE_REASON_LABELS: Record<IntakeClosureReason, string> = {
  out_of_scope: 'Fora do escopo',
  legally_unviable: 'Inviável juridicamente',
  client_withdrew: 'Desistência do cliente',
  unable_to_contact: 'Sem contato',
  no_show: 'Não compareceu',
  referred: 'Encaminhado',
  other: 'Outro',
}

export type ConfirmConsultationClosureDialogProps = {
  open: boolean
  isPending?: boolean
  closureReason: IntakeClosureReason | ''
  closureNotes: string
  error?: Error | null
  onOpenChange: (open: boolean) => void
  onClosureReasonChange: (reason: IntakeClosureReason) => void
  onClosureNotesChange: (notes: string) => void
  onConfirm: () => void
}

export const ConfirmConsultationClosureDialog = ({
  open,
  isPending = false,
  closureReason,
  closureNotes,
  error,
  onOpenChange,
  onClosureReasonChange,
  onClosureNotesChange,
  onConfirm,
}: ConfirmConsultationClosureDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className='max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-[696px] [&_[data-slot=dialog-close]]:top-6 [&_[data-slot=dialog-close]]:right-6 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-highlight/70 [&_[data-slot=dialog-close]]:text-foreground [&_[data-slot=dialog-close]]:hover:bg-highlight'>
      <DialogHeader className='border-b border-border px-7 py-6 pr-20'>
        <DialogTitle className='font-serif text-2xl font-semibold leading-tight text-brand'>
          Encerrar sem contratação?
        </DialogTitle>
        <DialogDescription className='text-sm leading-6 text-muted-foreground'>
          Informe o motivo e confirme o encerramento definitivo deste intake.
        </DialogDescription>
      </DialogHeader>

      <div className='space-y-6 px-7 py-6'>
        <div className='space-y-2'>
          <Label htmlFor='consultation-closure-reason' className='text-sm font-semibold'>
            Motivo do encerramento <span className='text-destructive'>*</span>
          </Label>
          <Select
            value={closureReason}
            onValueChange={(value) => onClosureReasonChange(value as IntakeClosureReason)}
          >
            <SelectTrigger
              id='consultation-closure-reason'
              aria-required='true'
              className='h-12 w-full rounded-lg px-4 text-base'
            >
              <Icon name='tag' className='size-4 text-destructive' />
              <SelectValue placeholder='Selecione um motivo' />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CLOSURE_REASON_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='consultation-closure-notes' className='text-sm font-semibold'>
            Observações{' '}
            <span className='font-normal text-muted-foreground'>(opcional)</span>
          </Label>
          <Textarea
            id='consultation-closure-notes'
            value={closureNotes}
            onChange={(event) => onClosureNotesChange(event.target.value)}
            placeholder='Adicione informações complementares sobre o encerramento.'
            rows={4}
            className='min-h-32 resize-none px-4 py-3 text-base'
          />
        </div>

        <div className='flex items-center gap-3 rounded-lg bg-highlight px-4 py-3 text-sm font-medium text-highlight-foreground'>
          <Icon name='info' className='size-4 shrink-0' />
          <span>O cliente e o histórico permanecerão disponíveis.</span>
        </div>

        {error && (
          <p className='text-sm text-destructive' role='alert'>
            {error.message}
          </p>
        )}
      </div>

      <DialogFooter className='border-t border-border bg-card px-7 py-5 sm:justify-end'>
        <Button
          type='button'
          variant='brand'
          size='lg'
          onClick={() => onOpenChange(false)}
          disabled={isPending}
          className='rounded-full px-8'
        >
          Cancelar
        </Button>
        <Button
          type='button'
          variant='destructive'
          size='lg'
          onClick={onConfirm}
          disabled={isPending || !closureReason}
          className='rounded-full bg-destructive px-8 text-destructive-foreground hover:bg-destructive/90'
        >
          <Icon name='door-open' className='size-4' />
          {isPending ? 'Encerrando...' : 'Encerrar sem contratação'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
