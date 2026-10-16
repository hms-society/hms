import { formatDateLabel, getTodayInSaoPaulo } from '@/ui/scheduling/date-utils'
import type { CalendarEventView } from '@/ui/scheduling/types'
import { AppointmentCard } from '../appointment-card'
import { useWeekCalendar } from './use-week-calendar'

export type WeekCalendarProps = {
  date: string
  events: CalendarEventView[]
  onOpenAppointment: (appointmentId: string, trigger: HTMLElement) => void
}

export function WeekCalendar({ date, events, onOpenAppointment }: WeekCalendarProps) {
  const { days, eventsByDay } = useWeekCalendar(date, events)
  const today = getTodayInSaoPaulo()

  return (
    <section
      aria-label='Agenda semanal'
      className='overflow-hidden rounded-xl border border-border bg-card'
    >
      <div className='grid grid-cols-[52px_repeat(7,minmax(0,1fr))] border-b border-border'>
        <span aria-hidden='true' className='border-r border-border' />
        {days.map((day) => (
          <div
            key={day}
            className={`border-r border-border px-2 py-3 text-center text-[11px] font-semibold uppercase last:border-r-0 ${day === today ? 'bg-highlight text-highlight-foreground' : 'text-muted-foreground'}`}
          >
            {formatDateLabel(day, { weekday: 'short', day: '2-digit' })}
          </div>
        ))}
      </div>
      <div className='grid grid-cols-[52px_repeat(7,minmax(0,1fr))]'>
        <div className='grid grid-rows-10 border-r border-border text-[10px] text-muted-foreground'>
          {Array.from({ length: 10 }, (_, index) => {
            const hour = String(index + 8).padStart(2, '0')
            return (
              <span key={hour} className='border-b border-border px-2 py-3 text-right'>
                {hour}:00
              </span>
            )
          })}
        </div>
        {days.map((day) => {
          const dayEvents = eventsByDay.get(day) ?? []
          return (
            <div
              key={day}
              className={`min-h-[560px] border-r border-border p-1.5 last:border-r-0 ${day === today ? 'bg-highlight/40' : ''}`}
            >
              <div className='mb-2 flex flex-col gap-1'>
                {dayEvents
                  .filter((event) => event.kind === 'block')
                  .map((event) => (
                    <AppointmentCard
                      key={event.blockedPeriodId}
                      event={event}
                      onOpen={onOpenAppointment}
                    />
                  ))}
              </div>
              <div className='flex flex-col gap-2'>
                {dayEvents
                  .filter((event) => event.kind === 'appointment')
                  .map((event) => (
                    <AppointmentCard
                      key={event.appointmentId}
                      event={event}
                      onOpen={onOpenAppointment}
                    />
                  ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
