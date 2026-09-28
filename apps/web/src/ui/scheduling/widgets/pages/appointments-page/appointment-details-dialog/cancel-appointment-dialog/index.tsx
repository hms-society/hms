import { CalendarX2, Info } from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { useCancelAppointmentDialog } from './use-cancel-appointment-dialog'
import type { AppointmentDetailsView } from '@/ui/scheduling/types'

export type CancelAppointmentDialogProps = {
  open: boolean
  detail?: AppointmentDetailsView
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CancelAppointmentDialog({
  open,
  detail,
  onOpenChange,
  onSuccess,
}: CancelAppointmentDialogProps) {
  const controller = useCancelAppointmentDialog(detail, onSuccess)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='gap-0 overflow-hidden p-0 sm:max-w-xl'>
        <DialogHeader className='border-b border-border p-6'>
          <DialogTitle className='font-serif text-xl'>Cancelar agendamento?</DialogTitle>
          <DialogDescription>Confirme o cancelamento deste horário.</DialogDescription>
        </DialogHeader>
        <div className='space-y-3 p-6'>
          <div className='flex gap-3'>
            <CalendarX2
              className='mt-0.5 size-5 shrink-0 text-destructive'
              aria-hidden='true'
            />
            <div className='min-w-0 flex-1'>
              <p className='font-semibold'>O agendamento será cancelado</p>
              <p className='text-sm text-muted-foreground'>
                O horário será liberado e a Consulta não poderá ser iniciada. Você ainda
                poderá marcar outro horário.
              </p>
            </div>
          </div>
          <p className='flex items-start gap-2 rounded-lg bg-highlight/60 p-3 text-xs text-highlight-foreground'>
            <Info className='mt-0.5 size-4 shrink-0' aria-hidden='true' />
            <span className='min-w-0 flex-1'>
              O Intake, o cliente e o histórico serão preservados. Para encerrar o Intake,
              use a ação própria.
            </span>
          </p>
          {controller.error ? (
            <p role='alert' className='text-sm text-destructive'>
              {controller.error.message}
            </p>
          ) : null}
        </div>
        <DialogFooter className='mx-0 mb-0 rounded-b-xl px-6 py-4 sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            disabled={controller.isCancelling}
            onClick={() => onOpenChange(false)}
          >
            Manter agendamento
          </Button>
          <Button
            type='button'
            variant='destructive'
            disabled={controller.isCancelling}
            onClick={() => void controller.handleConfirm()}
          >
            {controller.isCancelling ? 'Cancelando…' : 'Cancelar agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
