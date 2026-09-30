import { formatDateLabel, getTodayInSaoPaulo } from '@/ui/scheduling/date-utils'
import type { CalendarEventView } from '@/ui/scheduling/types'
import { AppointmentCard } from '../appointment-card'
import { useMonthCalendar } from './use-month-calendar'

export type MonthCalendarProps = {
  date: string
  events: CalendarEventView[]
  onOpenAppointment: (appointmentId: string, trigger: HTMLElement) => void
  onOpenOverflow: (date: string, trigger: HTMLElement) => void
}

export function MonthCalendar({
  date,
  events,
  onOpenAppointment,
  onOpenOverflow,
}: MonthCalendarProps) {
  const { days, eventsByDay } = useMonthCalendar(date, events)
  const today = getTodayInSaoPaulo()
  const month = date.slice(0, 7)

  return (
    <section
      aria-label='Agenda mensal'
      className='overflow-hidden rounded-xl border border-border bg-card'
    >
      <div className='grid grid-cols-7 border-b border-border'>
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label) => (
          <div
            key={label}
            className='border-r border-border px-2 py-3 text-center text-[11px] font-semibold uppercase text-muted-foreground last:border-r-0'
          >
            {label}
          </div>
        ))}
      </div>
      <div className='grid grid-cols-7'>
        {days.map((day) => {
          const dayEvents = eventsByDay.get(day) ?? []
          const visible = dayEvents.slice(0, 2)
          const overflowCount = Math.max(0, dayEvents.length - visible.length)
          return (
            <div
              key={day}
              className={`min-h-36 border-r border-b border-border p-2 last:border-r-0 ${day.slice(0, 7) !== month ? 'bg-muted/20 text-muted-foreground' : ''} ${day === today ? 'bg-highlight/40' : ''}`}
            >
              <div className='mb-2 text-xs font-semibold'>
                {formatDateLabel(day, { day: 'numeric' })}
              </div>
              <div className='flex flex-col gap-1'>
                {visible.map((event) => (
                  <AppointmentCard
                    key={
                      event.kind === 'block' ? event.blockedPeriodId : event.appointmentId
                    }
                    event={event}
                    compact
                    onOpen={onOpenAppointment}
                  />
                ))}
                {overflowCount > 0 ? (
                  <button
                    type='button'
                    className='rounded-md px-1 text-left text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring'
                    onClick={(event) => onOpenOverflow(day, event.currentTarget)}
                  >
                    +{overflowCount} consultas
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
