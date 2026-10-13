import {
  addMonths,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings2,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { useConsultation } from '../use-schedule'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function MyAgendaPage() {
  const { schedule, isLoading, isError, error, refetch, removeBlock, isRemovingBlock } =
    useConsultation()
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const [selectedBlock, setSelectedBlock] = useState<any>(null)

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
  const blockedPeriods = schedule?.blockedPeriods ?? []

  function formatBlockedDate(date: string) {
    return format(parseISO(date), 'dd/MM/yyyy')
  }

  function blocksOnDay(day: Date) {
    return blockedPeriods.filter((block: any) => {
      if (!block.startsOn || !block.endsOn) return false
      return isWithinInterval(startOfDay(day), {
        start: startOfDay(parseISO(block.startsOn)),
        end: startOfDay(parseISO(block.endsOn)),
      })
    })
  }

  async function handleRemoveBlock() {
    if (!selectedBlock) return
    await removeBlock(selectedBlock.id)
    setSelectedBlock(null)
  }

  if (isLoading) {
    return (
      <main className='flex min-h-[calc(100vh-2rem)] w-full items-center justify-center'>
        <Loader2
          className='size-7 animate-spin text-primary'
          aria-label='Carregando agenda'
        />
      </main>
    )
  }

  if (isError) {
    return (
      <main className='flex min-h-[calc(100vh-2rem)] w-full items-center justify-center px-4'>
        <section className='flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-sm'>
          <CalendarDays className='size-8 text-destructive' aria-hidden='true' />
          <h1 className='font-serif text-2xl font-semibold text-foreground'>
            Não foi possível carregar a agenda
          </h1>
          <p className='text-sm text-muted-foreground'>
            {error instanceof Error
              ? error.message
              : 'Tente novamente em alguns instantes.'}
          </p>
          <Button className='rounded-full' onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </section>
      </main>
    )
  }

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
              className='group relative min-h-24 border-b border-r border-border p-2 sm:min-h-32 sm:p-3'
              key={day?.toISOString() ?? `empty-${index}`}
            >
              {day && (
                <>
                  <div className='flex items-center'>
                    <span
                      className={`inline-flex size-7 items-center justify-center rounded-full text-sm ${
                        isToday(day)
                          ? 'bg-primary font-semibold text-primary-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div className='mt-2 flex flex-col gap-1'>
                    {blocksOnDay(day).map((block: any) => (
                      <button
                        className='flex w-full items-center justify-start gap-1 rounded-md border border-brand-accent/40 bg-brand-accent/15 px-2 py-1 text-left text-xs font-medium text-accent-foreground hover:bg-brand-accent/25'
                        key={block.id}
                        type='button'
                        onClick={() => setSelectedBlock(block)}
                      >
                        <span className='truncate'>{block.reason || 'Bloqueio'}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {!schedule && (
        <section className='-mt-2 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card p-6 text-center'>
          <p className='text-sm text-muted-foreground'>
            Sua agenda ainda não foi configurada.
          </p>
          <Button asChild className='rounded-full'>
            <Link to='/agenda/configurar'>Configurar agenda</Link>
          </Button>
        </section>
      )}

      <Dialog
        open={Boolean(selectedBlock)}
        onOpenChange={(open: boolean) => !open && setSelectedBlock(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do bloqueio</DialogTitle>
          </DialogHeader>
          {selectedBlock && (
            <div className='grid gap-2 text-sm text-muted-foreground'>
              <p>
                <strong className='text-foreground'>Período:</strong>{' '}
                {formatBlockedDate(selectedBlock.startsOn)} até{' '}
                {formatBlockedDate(selectedBlock.endsOn)}
              </p>
              <p>
                <strong className='text-foreground'>Motivo:</strong>{' '}
                {selectedBlock.reason || 'Não informado'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              className='rounded-full'
              variant='outline'
              onClick={() => setSelectedBlock(null)}
            >
              Fechar
            </Button>
            <Button
              className='rounded-full'
              disabled={isRemovingBlock}
              variant='destructive'
              onClick={handleRemoveBlock}
            >
              {isRemovingBlock ? (
                <Loader2 className='size-4 animate-spin' aria-hidden='true' />
              ) : (
                <Trash2 className='size-4' aria-hidden='true' />
              )}
              Remover bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
