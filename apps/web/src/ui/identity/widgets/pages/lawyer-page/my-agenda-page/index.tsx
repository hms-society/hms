import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/ui/shadcn/button'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function MyAgendaPage() {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth)
    const firstWeekday = monthStart.getDay()
    const daysInMonth = endOfMonth(visibleMonth).getDate()

    return Array.from({ length: firstWeekday + daysInMonth }, (_, index) => {
      if (index < firstWeekday) return null
      return new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        index - firstWeekday + 1,
      )
    })
  }, [visibleMonth])

  const today = new Date()
  const isToday = (day: Date) => day.toDateString() === today.toDateString()

  return (
    <main className='flex min-h-[calc(100vh-2rem)] w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8'>
      <header className='flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <CalendarDays
            className='mt-1 size-6 shrink-0 text-primary'
            aria-hidden='true'
          />
          <div>
            <p className='text-sm font-medium uppercase tracking-[0.16em] text-brand-accent'>
              Agenda
            </p>
            <h1 className='font-serif text-3xl font-semibold text-foreground'>
              Minha agenda
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Consulte seus horários, compromissos e bloqueios.
            </p>
          </div>
        </div>

        <Button asChild className='rounded-full self-start sm:self-auto'>
          <Link to='/agenda/configurar'>
            <Settings2 className='size-4' aria-hidden='true' />
            Configurar agenda
          </Link>
        </Button>
      </header>

      <section className='flex min-h-[min(72vh,720px)] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm'>
        <div className='flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
          <h2 className='font-serif text-2xl font-semibold capitalize text-foreground'>
            {format(visibleMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className='flex items-center gap-2'>
            <Button
              aria-label='Mês anterior'
              className='rounded-full'
              size='icon'
              variant='outline'
              onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
            >
              <ChevronLeft className='size-4' aria-hidden='true' />
            </Button>
            <Button
              className='rounded-full px-4'
              variant='outline'
              onClick={() => setVisibleMonth(startOfMonth(new Date()))}
            >
              Hoje
            </Button>
            <Button
              aria-label='Próximo mês'
              className='rounded-full'
              size='icon'
              variant='outline'
              onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
            >
              <ChevronRight className='size-4' aria-hidden='true' />
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-7 border-b border-border bg-muted/40'>
          {WEEKDAYS.map((weekday) => (
            <div
              className='px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm'
              key={weekday}
            >
              {weekday}
            </div>
          ))}
        </div>

        <div className='grid flex-1 auto-rows-fr grid-cols-7'>
          {calendarDays.map((day, index) => (
            <div
              className='min-h-24 border-b border-r border-border p-2 sm:min-h-32 sm:p-3'
              key={day?.toISOString() ?? `empty-${index}`}
            >
              {day && (
                <span
                  className={`inline-flex size-7 items-center justify-center rounded-full text-sm ${
                    isToday(day)
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {day.getDate()}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
