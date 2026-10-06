import { ChevronDown, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { useCalendarToolbar } from './use-calendar-toolbar'
import type { CalendarQueryState } from '@/ui/scheduling/types'

export type CalendarToolbarProps = {
  view: CalendarQueryState['view']
  date: string
  clientId?: string
  lawyerId?: string
  lawyerLabel?: string
  event: CalendarQueryState['event']
  showBlockedFilter?: boolean
  onViewChange: (view: CalendarQueryState['view']) => void
  onPrevious: () => void
  onNext: () => void
  onLawyerFilterOpen: () => void
  onEventChange: (event: CalendarQueryState['event']) => void
  onClientFilterOpen: () => void
  onClearFilters: () => void
}

export function CalendarToolbar(props: CalendarToolbarProps) {
  const { intervalLabel, monthLabel } = useCalendarToolbar(props.view, props.date)
  const hasFilters = Boolean(props.clientId || props.lawyerId || props.event !== 'all')

  return (
    <div className='flex flex-col gap-3 rounded-xl border border-border bg-card p-2.5 sm:flex-row sm:flex-wrap sm:items-center'>
      <div
        className='flex rounded-lg bg-muted p-1'
        role='tablist'
        aria-label='Visualização da agenda'
      >
        {(['week', 'month'] as const).map((view) => (
          <button
            key={view}
            type='button'
            role='tab'
            aria-selected={props.view === view}
            onClick={() => props.onViewChange(view)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${props.view === view ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {view === 'week' ? 'Semana' : 'Mês'}
          </button>
        ))}
      </div>
      <div className='flex items-center gap-1'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Período anterior'
          onClick={props.onPrevious}
        >
          <ChevronLeft aria-hidden='true' />
        </Button>
        <span className='min-w-36 text-center text-sm font-semibold capitalize'>
          {props.view === 'week' ? intervalLabel : monthLabel}
        </span>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Próximo período'
          onClick={props.onNext}
        >
          <ChevronRight aria-hidden='true' />
        </Button>
      </div>
      <div className='flex w-full flex-wrap gap-2'>
        <Button
          type='button'
          variant='outline'
          className={`w-40 shrink-0 justify-between bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent ${props.clientId ? 'border-primary text-primary hover:text-primary' : ''}`}
          onClick={props.onClientFilterOpen}
          aria-label='Filtrar por cliente'
        >
          <span className='flex min-w-0 flex-1 items-center gap-2'>
            <Search className='size-4 shrink-0' aria-hidden='true' />
            <span className='min-w-0 truncate'>
              {props.clientId ? 'Cliente selecionado' : 'Todos os clientes'}
            </span>
          </span>
        </Button>
        <Button
          type='button'
          variant='outline'
          className={`w-40 shrink-0 justify-between bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent ${props.lawyerId ? 'border-primary text-primary hover:text-primary' : ''}`}
          onClick={props.onLawyerFilterOpen}
          aria-label='Filtrar por advogado'
        >
          <span className='flex min-w-0 flex-1 items-center gap-2'>
            <Search className='size-4 shrink-0' aria-hidden='true' />
            <span className='min-w-0 truncate'>
              {props.lawyerLabel ??
                (props.lawyerId ? 'Advogado selecionado' : 'Todos os colaboradores')}
            </span>
          </span>
          <ChevronDown
            className='size-4 shrink-0 text-muted-foreground'
            aria-hidden='true'
          />
        </Button>
        <Select
          value={props.event}
          onValueChange={(value) =>
            props.onEventChange(value as CalendarQueryState['event'])
          }
        >
          <SelectTrigger
            className='w-40 shrink-0 dark:bg-transparent dark:hover:bg-transparent'
            aria-label='Filtrar por situação'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos os status</SelectItem>
            <SelectItem value='scheduled'>Agendados</SelectItem>
            <SelectItem value='cancelled'>Cancelados</SelectItem>
            <SelectItem value='no_show'>Não compareceu</SelectItem>
            {props.showBlockedFilter === false ? null : (
              <SelectItem value='blocked'>Bloqueios</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      {hasFilters ? (
        <Button type='button' variant='ghost' size='sm' onClick={props.onClearFilters}>
          <Filter className='size-4' aria-hidden='true' />
          Limpar
        </Button>
      ) : null}
    </div>
  )
}
