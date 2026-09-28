import { formatDateLabel, getTodayInSaoPaulo } from '@/ui/scheduling/date-utils'
import type { CalendarEventView } from '@/ui/scheduling/types'
import { AppointmentCard } from '../appointment-card'
import { useMobileDayList } from './use-mobile-day-list'

export type MobileDayListProps = {
  view: 'week' | 'month'
  date: string
  events: CalendarEventView[]
  onOpenAppointment: (appointmentId: string, trigger: HTMLElement) => void
}

export function MobileDayList({
  view,
  date,
  events,
  onOpenAppointment,
}: MobileDayListProps) {
  const groups = useMobileDayList(view, date, events)
  const today = getTodayInSaoPaulo()

  return (
    <section aria-label='Agenda em lista' className='flex flex-col gap-3'>
      {groups.map((group) => (
        <div
          key={group.day}
          className={`rounded-xl border border-border bg-card p-3 ${group.day === today ? 'ring-1 ring-primary/40' : ''}`}
        >
          <h2 className='mb-3 font-serif text-lg font-semibold capitalize'>
            {formatDateLabel(group.day, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </h2>
          {group.events.length > 0 ? (
            <div className='flex flex-col gap-2'>
              {group.events.map((event) => (
                <AppointmentCard
                  key={
                    event.kind === 'block' ? event.blockedPeriodId : event.appointmentId
                  }
                  event={event}
                  onOpen={onOpenAppointment}
                />
              ))}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>Nenhum compromisso neste dia.</p>
          )}
        </div>
      ))}
    </section>
  )
}
