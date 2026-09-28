import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { useEffect } from 'react'
import { formatDateLabel } from '@/ui/scheduling/date-utils'
import type { CalendarEventView } from '@/ui/scheduling/types'
import { AppointmentCard } from '../appointment-card'
import { useDayEventsDialog } from './use-day-events-dialog'

export type DayEventsDialogProps = {
  open: boolean
  date?: string
  trigger?: HTMLElement | null
  events: CalendarEventView[]
  onOpenChange: (open: boolean) => void
  onOpenAppointment: (appointmentId: string, trigger: HTMLElement) => void
}

export function DayEventsDialog({
  open,
  date,
  trigger,
  events,
  onOpenChange,
  onOpenAppointment,
}: DayEventsDialogProps) {
  const { captureTrigger } = useDayEventsDialog(open)

  useEffect(() => {
    if (open && trigger) captureTrigger(trigger)
  }, [captureTrigger, open, trigger])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[min(700px,calc(100vh-2rem))] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='font-serif'>Compromissos do dia</DialogTitle>
          <DialogDescription>
            {date
              ? formatDateLabel(date, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : ''}
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-2'>
          {events.map((event) => (
            <AppointmentCard
              key={event.kind === 'block' ? event.blockedPeriodId : event.appointmentId}
              event={event}
              onOpen={(id, cardTrigger) => {
                onOpenAppointment(id, trigger ?? cardTrigger)
                onOpenChange(false)
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
