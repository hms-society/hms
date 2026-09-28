import { Clock3, LockKeyhole, UserRound } from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
import { formatTime, formatDuration } from '@/ui/scheduling/date-utils'
import type { CalendarEventView } from '@/ui/scheduling/types'

export type AppointmentCardProps = {
  event: CalendarEventView
  onOpen?: (appointmentId: string, trigger: HTMLElement) => void
  compact?: boolean
}

export function AppointmentCard({
  event,
  onOpen,
  compact = false,
}: AppointmentCardProps) {
  if (event.kind === 'block') {
    return (
      <div className='rounded-lg border border-dashed border-brand/40 bg-highlight/60 p-2 text-xs text-highlight-foreground'>
        <div className='flex items-center gap-1.5 font-semibold'>
          <LockKeyhole className='size-3.5' aria-hidden='true' />
          Bloqueio de agenda
        </div>
        {event.reason ? <p className='mt-1 truncate'>{event.reason}</p> : null}
        <p className='mt-1 text-[11px]'>Dia inteiro · {event.timeZone}</p>
      </div>
    )
  }

  const statusLabel = getStatusLabel(event)
  const isCancelled = event.status === 'cancelled'

  return (
    <Button
      type='button'
      variant='outline'
      onClick={(clickEvent) => onOpen?.(event.appointmentId, clickEvent.currentTarget)}
      className={`h-auto w-full min-w-0 flex-col items-start gap-1 rounded-lg border-border bg-card p-2 text-left shadow-xs hover:border-primary hover:bg-card ${isCancelled ? 'opacity-70' : ''}`}
      aria-label={`Abrir consulta de ${event.clientName}, ${formatTime(event.startsAt, event.timeZone)}`}
    >
      <span className='flex w-full items-center gap-1 text-[11px] font-semibold text-primary'>
        <Clock3 className='size-3 shrink-0' aria-hidden='true' />
        {formatTime(event.startsAt, event.timeZone)}–
        {formatTime(event.endsAt, event.timeZone)}
      </span>
      <span className='w-full truncate text-xs font-semibold text-foreground'>
        {event.clientName}
      </span>
      {!compact ? (
        <span className='flex w-full items-center gap-1 truncate text-[11px] text-muted-foreground'>
          <UserRound className='size-3 shrink-0' aria-hidden='true' />
          {event.lawyerName}
        </span>
      ) : null}
      <span className='text-[10px] text-muted-foreground'>
        {statusLabel} · {formatDuration(event.startsAt, event.endsAt)} min
      </span>
    </Button>
  )
}

function getStatusLabel(event: Extract<CalendarEventView, { kind: 'appointment' }>) {
  if (event.status === 'cancelled') return 'Cancelado'
  if (event.consultationStatus === 'no_show') return 'Não compareceu'
  if (event.consultationStatus === 'completed') return 'Concluído'
  if (event.consultationStatus === 'in_progress') return 'Em andamento'
  return 'Agendado'
}
