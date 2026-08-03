import { Calendar } from '@/ui/shadcn/calendar'
import { Button } from '@/ui/shadcn/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/ui/shadcn/popover'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useFormatDateOnly } from '@/ui/shared/hooks/use-format-date-only'
import type { DateRange } from 'react-day-picker'

export type IntakeDateRangeFilterProps = {
  registeredFrom?: string | null
  registeredTo?: string | null
  onChange: (range: {
    registeredFrom: string | null
    registeredTo: string | null
  }) => void
}

export const IntakeDateRangeFilter = ({
  registeredFrom,
  registeredTo,
  onChange,
}: IntakeDateRangeFilterProps) => {
  const formatDateOnly = useFormatDateOnly()
  const selectedRange: DateRange | undefined = registeredFrom
    ? {
        from: new Date(`${registeredFrom}T12:00:00`),
        to: registeredTo ? new Date(`${registeredTo}T12:00:00`) : undefined,
      }
    : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='h-[38px] w-full justify-between rounded-full bg-transparent px-3 text-xs font-normal text-muted-foreground'
          aria-label='Filtrar por período de registro'
        >
          <span>
            {registeredFrom || registeredTo
              ? `${registeredFrom ?? '…'} — ${registeredTo ?? '…'}`
              : 'Todo o período'}
          </span>
          <Icon name='calendar-days' className='size-3.5' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto p-3'>
        <PopoverHeader className='mb-2'>
          <PopoverTitle>Período de registro</PopoverTitle>
          <PopoverDescription>Escolha o intervalo para a fila.</PopoverDescription>
        </PopoverHeader>
        <Calendar
          mode='range'
          selected={selectedRange}
          onSelect={(range) => {
            onChange({
              registeredFrom: range?.from ? formatDateOnly(range.from) : null,
              registeredTo: range?.to ? formatDateOnly(range.to) : null,
            })
          }}
        />
        {(registeredFrom || registeredTo) && (
          <Button
            type='button'
            variant='ghost'
            className='w-full'
            onClick={() => onChange({ registeredFrom: null, registeredTo: null })}
          >
            Limpar período
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
