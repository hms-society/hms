import type { ContactChannel, IntakeOrigin } from '@hms/core/intake/domain/structures'
import type { ResponsibleListProjection } from '@hms/core/identity/domain/structures'

import { useState } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/ui/shadcn/popover'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { IntakeDateRangeFilter } from '../intake-date-range-filter'
import { IntakeFilterSelect } from '../intake-filter-select'
import {
  INTAKE_CONTACT_CHANNEL_LABELS,
  INTAKE_ORIGIN_LABELS,
} from '../intakes-page-constants'
import type { IntakeSearchParams } from '../intakes-page-search'

export type IntakesFiltersProps = {
  isLoadingResponsibles: boolean
  responsibles: readonly ResponsibleListProjection[]
  responsiblesError: unknown
  searchParams: IntakeSearchParams
  onClear: () => void
  onRetryResponsibles: () => void
  onUpdate: (patch: Partial<IntakeSearchParams>) => void
}

export const IntakesFilters = ({
  isLoadingResponsibles,
  responsibles,
  responsiblesError,
  searchParams,
  onClear,
  onRetryResponsibles,
  onUpdate,
}: IntakesFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className='flex flex-col gap-2 sm:flex-row' aria-label='Filtros de intakes'>
      <div className='relative min-w-0 flex-1'>
        <Icon
          name='search'
          className='pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground'
        />
        <Input
          id='intake-search'
          aria-label='Buscar intake'
          value={searchParams.search ?? ''}
          onChange={(event) => onUpdate({ search: event.target.value || null })}
          placeholder='Buscar por ID ou pessoa'
          className='h-10 rounded-full bg-card pl-10 text-xs shadow-sm'
        />
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            className='h-10 rounded-full px-4 text-xs'
          >
            <Icon name='list-search' /> Filtros
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align='end'
          sideOffset={10}
          className='w-[min(25.5rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card p-0 shadow-lg'
          aria-label='Filtros de intakes'
        >
          <PopoverHeader className='flex-row items-start justify-between gap-4 border-b border-border px-5 pt-5 pb-4'>
            <div className='space-y-1'>
              <PopoverTitle className='font-serif text-xl font-semibold text-foreground'>
                Filtrar intakes
              </PopoverTitle>
              <PopoverDescription className='text-[11px]'>
                Refine a lista sem alterar a situação selecionada.
              </PopoverDescription>
            </div>
            <button
              type='button'
              aria-label='Fechar filtros'
              onClick={() => setIsOpen(false)}
              className='flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50'
            >
              <Icon name='x' className='size-3.5' />
            </button>
          </PopoverHeader>

          <div className='space-y-4 px-5 py-[18px]'>
            <IntakeFilterSelect
              label='Responsável'
              icon='user'
              value={searchParams.responsibleId}
              placeholder={
                isLoadingResponsibles ? 'Carregando…' : 'Todos os responsáveis'
              }
              options={responsibles.map((responsible) => ({
                value: responsible.responsibleId,
                label: responsible.professionalName,
              }))}
              onChange={(value) => onUpdate({ responsibleId: value })}
              disabled={isLoadingResponsibles || Boolean(responsiblesError)}
            />
            <div className='grid gap-3 sm:grid-cols-2'>
              <IntakeFilterSelect
                label='Origem'
                icon='map-pin'
                value={searchParams.origin}
                placeholder='Todas as origens'
                options={Object.entries<string>(INTAKE_ORIGIN_LABELS).map(
                  ([value, label]) => ({ value, label }),
                )}
                onChange={(value) => onUpdate({ origin: value as IntakeOrigin | null })}
              />
              <IntakeFilterSelect
                label='Canal de contato'
                icon='messages-square'
                value={searchParams.contactChannel}
                placeholder='Todos os canais'
                options={Object.entries<string>(INTAKE_CONTACT_CHANNEL_LABELS).map(
                  ([value, label]) => ({ value, label }),
                )}
                onChange={(value) =>
                  onUpdate({ contactChannel: value as ContactChannel | null })
                }
              />
            </div>
            <div className='space-y-2'>
              <span className='block text-[11px] font-bold text-foreground'>
                Período de registro
              </span>
              <IntakeDateRangeFilter
                registeredFrom={searchParams.registeredFrom}
                registeredTo={searchParams.registeredTo}
                onChange={onUpdate}
              />
            </div>
            <div className='flex items-center gap-2 rounded-lg bg-secondary px-3 py-2.5 text-[10px] font-semibold text-secondary-foreground'>
              <Icon name='info' className='size-3.5 shrink-0 text-highlight-foreground' />
              <span>O status é definido pelo filtro da listagem.</span>
            </div>
            {Boolean(responsiblesError) && (
              <div
                className='flex flex-wrap items-center gap-2 text-xs text-destructive'
                role='alert'
              >
                <span>Não foi possível carregar os responsáveis.</span>
                <Button
                  type='button'
                  variant='link'
                  className='h-auto p-0 text-xs'
                  onClick={onRetryResponsibles}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
          </div>

          <div className='flex items-center justify-between border-t border-border px-5 py-4'>
            <Button
              type='button'
              variant='link'
              className='h-auto p-0 text-xs text-primary'
              onClick={() => {
                onClear()
                setIsOpen(false)
              }}
            >
              Limpar filtros
            </Button>
            <Button
              type='button'
              size='sm'
              className='rounded-full px-4 text-xs'
              onClick={() => setIsOpen(false)}
            >
              <Icon name='check' /> Aplicar filtros
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </section>
  )
}
