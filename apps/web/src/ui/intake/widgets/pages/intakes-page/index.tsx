import type { IntakeListItem, IntakeListStatus } from '@hms/core/intake/domain/structures'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { CollaboratorAvatar } from '@/ui/identity/widgets/components/collaborator-avatar'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { IconName } from '@/ui/shared/widgets/components/icon/types'
import { PageTitle } from '@/ui/shared/widgets/components/page-title'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { Input } from '@/ui/shadcn/input'
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select'
import { Skeleton } from '@/ui/shadcn/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { Tabs, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { TableSurface } from '@/ui/shared/widgets/components/table-surface'

import { useIntakesPage } from './use-intakes-page'

const statusOptions: Array<{ value: IntakeListStatus; label: string }> = [
  { value: 'consultation_scheduling', label: 'Agendando consulta' },
  { value: 'consultation_scheduling_failed', label: 'Agendamento com falha' },
  { value: 'consultation_scheduled', label: 'Consulta agendada' },
  { value: 'consultation_completed', label: 'Consulta realizada' },
  { value: 'viability_registered', label: 'Viabilidade registrada' },
  { value: 'in_formalization', label: 'Em Formalização' },
  { value: 'contracted', label: 'Contratado' },
  { value: 'closed_without_contract', label: 'Encerrado sem contratação' },
]

const statusTabOptions = statusOptions.filter(({ value }) =>
  [
    'consultation_scheduled',
    'consultation_completed',
    'viability_registered',
    'in_formalization',
    'contracted',
    'closed_without_contract',
  ].includes(value),
)

const originOptions = [
  ['direct', 'Entrada direta'],
  ['referral', 'Indicação'],
  ['website', 'Site'],
  ['social_media', 'Redes sociais'],
  ['other', 'Outra origem'],
] as const

const contactChannelOptions = [
  ['whatsapp', 'WhatsApp'],
  ['email', 'E-mail'],
  ['phone', 'Telefone'],
  ['in_person', 'Presencial'],
] as const

const statusLabels = new Map(statusOptions.map((option) => [option.value, option.label]))

const periodOptions = [
  ['all', 'Todo o período'],
  ['today', 'Hoje'],
  ['last_7_days', 'Últimos 7 dias'],
  ['last_30_days', 'Últimos 30 dias'],
  ['this_month', 'Este mês'],
  ['custom', 'Período personalizado'],
] as const

type PeriodValue = (typeof periodOptions)[number][0]

type AdvancedFilterDraft = {
  period: PeriodValue
  responsibleId: string | null
  origin: string | null
  contactChannel: string | null
  registeredFrom: string | null
  registeredTo: string | null
}

export const IntakesPage = () => {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [advancedDraft, setAdvancedDraft] = useState<AdvancedFilterDraft>({
    period: 'all',
    responsibleId: null,
    origin: null,
    contactChannel: null,
    registeredFrom: null,
    registeredTo: null,
  })
  const {
    searchParams,
    intakes,
    responsibles,
    hasFilters,
    page,
    totalPages,
    update,
    clear,
  } = useIntakesPage()
  const counts = intakes.data?.statusCounts

  function openFilters() {
    setAdvancedDraft({
      period: getPeriodValue({
        period: 'all',
        responsibleId: searchParams.responsibleId,
        origin: searchParams.origin,
        contactChannel: searchParams.contactChannel,
        registeredFrom: searchParams.registeredFrom,
        registeredTo: searchParams.registeredTo,
      }),
      responsibleId: searchParams.responsibleId,
      origin: searchParams.origin,
      contactChannel: searchParams.contactChannel,
      registeredFrom: searchParams.registeredFrom,
      registeredTo: searchParams.registeredTo,
    })
    setFiltersOpen(true)
  }

  function applyAdvancedFilters() {
    void update({
      responsibleId: advancedDraft.responsibleId,
      origin: advancedDraft.origin,
      contactChannel: advancedDraft.contactChannel,
      registeredFrom: advancedDraft.registeredFrom,
      registeredTo: advancedDraft.registeredTo,
    })
    setFiltersOpen(false)
  }

  function clearAdvancedFilters() {
    void update({
      responsibleId: null,
      origin: null,
      contactChannel: null,
      registeredFrom: null,
      registeredTo: null,
    })
    setFiltersOpen(false)
  }

  return (
    <main
      className='mx-auto flex w-full flex-col gap-6'
      aria-labelledby='intakes-page-title'
    >
      <header className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <PageTitle id='intakes-page-title' className='text-[2rem] font-bold'>
            Intakes
          </PageTitle>
          <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
            Acompanhe cada demanda desde o primeiro contato até a contratação ou o
            encerramento.
          </p>
        </div>
        <Button asChild className='rounded-full px-5'>
          <Anchor route='newIntake'>
            <Icon name='list-plus' />
            Novo Intake
          </Anchor>
        </Button>
      </header>

      <section className='space-y-4' aria-label='Filtros de Intakes'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <div className='relative min-w-0 flex-1'>
            <Icon
              name='search'
              className='pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground/75'
            />
            <Input
              id='intake-search'
              aria-label='Buscar por protocolo, pessoa, documento ou demanda'
              value={searchParams.search}
              onChange={(event) => update({ search: event.target.value })}
              placeholder='Buscar por protocolo, pessoa, documento ou demanda'
              className='h-11 rounded-full border-input bg-card pl-11 text-sm shadow-none placeholder:text-muted-foreground/90'
            />
          </div>
          <Button
            type='button'
            variant='brand'
            aria-expanded={filtersOpen}
            aria-controls='intakes-filter-dialog'
            onClick={openFilters}
            className='h-11 gap-2 rounded-full px-6'
          >
            <Icon name='sliders-horizontal' className='size-4' />
            Filtros
            {hasFilters && <span className='sr-only'>com filtros ativos</span>}
          </Button>
        </div>

        <Tabs
          value={searchParams.status ?? 'all'}
          onValueChange={(value) =>
            update({ status: value === 'all' ? null : (value as IntakeListStatus) })
          }
        >
          <TabsList
            className='w-full gap-2 overflow-x-auto bg-transparent p-0'
            aria-label='Filtrar por status'
          >
            <TabsTrigger
              value='all'
              className='h-9 rounded-full bg-secondary px-3 py-0 text-xs text-secondary-foreground after:hidden data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
            >
              Todos
              <StatusCount count={counts?.all ?? 0} />
            </TabsTrigger>
            {statusTabOptions.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className='h-9 rounded-full bg-secondary px-3 py-0 text-xs text-secondary-foreground after:hidden data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
              >
                {option.label}
                <StatusCount count={counts?.byStatus[option.value] ?? 0} />
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Dialog
          open={filtersOpen}
          onOpenChange={(open) => {
            if (!open) setFiltersOpen(false)
          }}
        >
          <DialogContent
            id='intakes-filter-dialog'
            showCloseButton={false}
            className='max-h-[calc(100vh-2rem)] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-[472px]'
          >
            <DialogHeader className='border-b border-border px-6 pt-6 pb-5'>
              <div className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <DialogTitle className='font-serif text-2xl font-semibold text-brand'>
                    Filtrar intakes
                  </DialogTitle>
                  <DialogDescription>
                    Refine a lista sem alterar a situação selecionada.
                  </DialogDescription>
                </div>
                <DialogClose asChild>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    aria-label='Fechar filtros'
                    className='shrink-0 rounded-full bg-secondary text-foreground hover:bg-secondary/80'
                  >
                    <Icon name='x' />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>

            <div className='space-y-5 px-6 py-5'>
              <FilterSelect
                label='Responsável'
                leadingIcon='user'
                value={advancedDraft.responsibleId ?? ''}
                onChange={(value) =>
                  setAdvancedDraft((draft) => ({
                    ...draft,
                    responsibleId: value || null,
                  }))
                }
                ariaLabel='Filtrar por responsável'
              >
                <NativeSelectOption value=''>Todos os responsáveis</NativeSelectOption>
                {(responsibles.data ?? []).map((responsible) => (
                  <NativeSelectOption
                    key={responsible.responsibleId}
                    value={responsible.responsibleId}
                  >
                    {responsible.professionalName}
                  </NativeSelectOption>
                ))}
              </FilterSelect>

              <div className='grid gap-4 sm:grid-cols-2'>
                <FilterSelect
                  label='Origem'
                  leadingIcon='tag'
                  value={advancedDraft.origin ?? ''}
                  onChange={(value) =>
                    setAdvancedDraft((draft) => ({
                      ...draft,
                      origin: value || null,
                    }))
                  }
                  ariaLabel='Filtrar por origem'
                >
                  <NativeSelectOption value=''>Todas as origens</NativeSelectOption>
                  {originOptions.map(([value, label]) => (
                    <NativeSelectOption key={value} value={value}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </FilterSelect>
                <FilterSelect
                  label='Canal de contato'
                  leadingIcon='message-square'
                  value={advancedDraft.contactChannel ?? ''}
                  onChange={(value) =>
                    setAdvancedDraft((draft) => ({
                      ...draft,
                      contactChannel: value || null,
                    }))
                  }
                  ariaLabel='Filtrar por canal de contato'
                >
                  <NativeSelectOption value=''>Todos os canais</NativeSelectOption>
                  {contactChannelOptions.map(([value, label]) => (
                    <NativeSelectOption key={value} value={value}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </FilterSelect>
              </div>

              <FilterSelect
                label='Período de registro'
                leadingIcon='calendar'
                value={advancedDraft.period}
                onChange={(value) =>
                  setAdvancedDraft((draft) => ({
                    ...draft,
                    period: value as PeriodValue,
                    ...(value === 'custom' ? {} : periodRange(value)),
                  }))
                }
                ariaLabel='Filtrar por período de registro'
              >
                {periodOptions.map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </FilterSelect>

              {advancedDraft.period === 'custom' && (
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FilterField label='De' htmlFor='intake-registered-from'>
                    <Input
                      id='intake-registered-from'
                      aria-label='Data inicial de registro'
                      type='date'
                      value={advancedDraft.registeredFrom ?? ''}
                      onChange={(event) =>
                        setAdvancedDraft((draft) => ({
                          ...draft,
                          registeredFrom: event.target.value || null,
                        }))
                      }
                    />
                  </FilterField>
                  <FilterField label='Até' htmlFor='intake-registered-to'>
                    <Input
                      id='intake-registered-to'
                      aria-label='Data final de registro'
                      type='date'
                      value={advancedDraft.registeredTo ?? ''}
                      onChange={(event) =>
                        setAdvancedDraft((draft) => ({
                          ...draft,
                          registeredTo: event.target.value || null,
                        }))
                      }
                    />
                  </FilterField>
                </div>
              )}
            </div>

            <DialogFooter className='mx-0 mt-0 mb-0 flex-row items-center justify-between rounded-none border-t border-border bg-card px-6 py-5'>
              <Button
                type='button'
                variant='ghost'
                className='px-0 text-primary hover:bg-transparent hover:text-primary/80'
                onClick={clearAdvancedFilters}
              >
                Limpar filtros
              </Button>
              <Button
                type='button'
                className='rounded-full px-6'
                onClick={applyAdvancedFilters}
              >
                <Icon name='check' /> Aplicar filtros
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {intakes.isLoading ? (
        <IntakesLoading />
      ) : intakes.isError ? (
        <IntakesError onRetry={() => void intakes.refetch()} />
      ) : intakes.data?.items.length ? (
        <>
          <IntakesTable items={intakes.data.items} />
          <IntakesPagination
            page={page}
            pageSize={intakes.data.pageSize}
            total={intakes.data.total}
            totalPages={totalPages}
            onPage={(nextPage) => update({ page: nextPage })}
          />
        </>
      ) : (
        <IntakesEmpty filtered={hasFilters} onClear={() => void clear()} />
      )}
    </main>
  )
}

function StatusCount({ count }: { count: number }) {
  return (
    <span className='rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] leading-none text-current data-[state=active]:bg-primary-foreground/20'>
      {count}
    </span>
  )
}

function getPeriodValue(draft: AdvancedFilterDraft): PeriodValue {
  if (!draft.registeredFrom && !draft.registeredTo) return 'all'

  const today = new Date()
  const todayValue = toDateInputValue(today)
  const ranges: Record<
    Exclude<PeriodValue, 'all' | 'custom'>,
    Pick<AdvancedFilterDraft, 'registeredFrom' | 'registeredTo'>
  > = {
    today: { registeredFrom: todayValue, registeredTo: todayValue },
    last_7_days: {
      registeredFrom: toDateInputValue(addDays(today, -6)),
      registeredTo: todayValue,
    },
    last_30_days: {
      registeredFrom: toDateInputValue(addDays(today, -29)),
      registeredTo: todayValue,
    },
    this_month: {
      registeredFrom: toDateInputValue(
        new Date(today.getFullYear(), today.getMonth(), 1),
      ),
      registeredTo: todayValue,
    },
  }

  const matchingPeriod = Object.entries(ranges).find(
    ([, range]) =>
      range.registeredFrom === draft.registeredFrom &&
      range.registeredTo === draft.registeredTo,
  )

  return (matchingPeriod?.[0] as PeriodValue | undefined) ?? 'custom'
}

function periodRange(
  value: string,
): Pick<AdvancedFilterDraft, 'registeredFrom' | 'registeredTo'> {
  if (value === 'all') return { registeredFrom: null, registeredTo: null }

  if (value === 'custom') {
    return { registeredFrom: null, registeredTo: null }
  }

  const today = new Date()
  const todayValue = toDateInputValue(today)

  if (value === 'today') {
    return { registeredFrom: todayValue, registeredTo: todayValue }
  }

  if (value === 'last_7_days' || value === 'last_30_days') {
    const days = value === 'last_7_days' ? 6 : 29
    return {
      registeredFrom: toDateInputValue(addDays(today, -days)),
      registeredTo: todayValue,
    }
  }

  if (value === 'this_month') {
    return {
      registeredFrom: toDateInputValue(
        new Date(today.getFullYear(), today.getMonth(), 1),
      ),
      registeredTo: todayValue,
    }
  }

  return { registeredFrom: null, registeredTo: null }
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className='relative space-y-1.5'>
      <label htmlFor={htmlFor} className='text-xs font-bold text-foreground'>
        {label}
      </label>
      {children}
    </div>
  )
}

function FilterSelect({
  label,
  leadingIcon,
  value,
  onChange,
  ariaLabel,
  children,
}: {
  label: string
  leadingIcon?: IconName
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  children: ReactNode
}) {
  const id = `intake-${label.toLowerCase().replaceAll(' ', '-')}`
  return (
    <FilterField label={label} htmlFor={id}>
      {leadingIcon && (
        <Icon
          name={leadingIcon}
          className='pointer-events-none absolute top-9 left-3.5 z-10 size-4 text-muted-foreground'
        />
      )}
      <NativeSelect
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className='w-full [&>select]:pl-10'
      >
        {children}
      </NativeSelect>
    </FilterField>
  )
}

function IntakesTable({ items }: { items: readonly IntakeListItem[] }) {
  return (
    <TableSurface ariaLabel='Lista de Intakes'>
      <Table className='min-w-[78rem]'>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[7rem]'>ID</TableHead>
            <TableHead className='w-[9rem]'>Data de registro</TableHead>
            <TableHead className='w-[15rem]'>Cliente</TableHead>
            <TableHead>Demanda</TableHead>
            <TableHead>Canal de contato</TableHead>
            <TableHead>Atendente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='w-[5.5rem] text-center'>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.intakeId} tabIndex={0}>
              <TableCell className='font-mono text-xs font-semibold text-brand'>
                {item.displayId}
              </TableCell>
              <TableCell className='whitespace-nowrap text-xs text-muted-foreground'>
                {formatDate(item.createdAt)}
              </TableCell>
              <TableCell className='max-w-[15rem]'>
                <div className='truncate text-sm font-semibold' title={item.client.name}>
                  {item.client.name}
                </div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  {item.client.maskedTaxId}
                </div>
              </TableCell>
              <TableCell className='max-w-[20rem]'>
                <span
                  className='block truncate text-sm text-foreground'
                  title={item.demandNotes ?? 'Sem descrição registrada'}
                >
                  {item.demandNotes ?? 'Sem descrição registrada'}
                </span>
              </TableCell>
              <TableCell className='text-sm'>
                {contactChannelLabel(item.contactChannel)}
              </TableCell>
              <TableCell className='max-w-[13rem]'>
                <div
                  className='flex min-w-0 items-center gap-2'
                  title={item.responsible.professionalName}
                >
                  <CollaboratorAvatar
                    name={item.responsible.professionalName}
                    colorSeed={item.responsible.responsibleId}
                    className='!size-6 [&_[data-slot=avatar-fallback]]:text-[10px]'
                  />
                  <span className='truncate text-sm'>
                    {item.responsible.professionalName}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell className='text-center'>
                <IntakeActionsMenu item={item} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableSurface>
  )
}

function IntakeActionsMenu({ item }: { item: IntakeListItem }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='icon-xs'
          aria-label={`Ações de ${item.displayId}`}
          className='size-7 rounded-full border-primary text-primary hover:bg-highlight hover:text-primary'
        >
          <Icon name='ellipsis' className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-44'>
        <DropdownMenuItem asChild>
          <Anchor route='intakeDetails' params={{ intakeId: item.intakeId }}>
            <Icon name='eye' className='size-4 shrink-0' /> Acessar detalhes
          </Anchor>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            void navigator.clipboard?.writeText(item.displayId)
          }}
        >
          <Icon name='copy' className='size-4 shrink-0' /> Copiar protocolo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function StatusBadge({ status }: { status: IntakeListItem['status'] }) {
  const variant =
    status === 'consultation_scheduling_failed'
      ? 'waiting'
      : status === 'contracted' || status === 'consultation_completed'
        ? 'success'
        : status === 'viability_registered'
          ? 'attention'
          : status === 'consultation_scheduling'
            ? 'info'
            : 'secondary'

  return (
    <Badge variant={variant}>
      {statusLabels.get(status as IntakeListStatus) ?? status}
    </Badge>
  )
}

function IntakesLoading() {
  return (
    <TableSurface ariaLabel='Carregando lista de Intakes'>
      <div className='space-y-px bg-border'>
        {['one', 'two', 'three', 'four', 'five', 'six'].map((row) => (
          <div
            key={row}
            className='grid grid-cols-4 gap-6 bg-card px-6 py-5 md:grid-cols-7'
          >
            {['id', 'date', 'client', 'demand', 'channel', 'responsible', 'status'].map(
              (cell) => (
                <Skeleton key={cell} className='h-4 w-full' />
              ),
            )}
          </div>
        ))}
      </div>
    </TableSurface>
  )
}

function IntakesError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role='alert'
      className='flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 text-center shadow-sm'
    >
      <Icon name='alert-circle' className='size-6 text-destructive' />
      <p className='font-semibold text-foreground'>
        Não foi possível carregar os Intakes.
      </p>
      <p className='text-sm text-muted-foreground'>
        Tente novamente para atualizar a lista.
      </p>
      <Button type='button' variant='outline' onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}

function IntakesEmpty({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className='flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 text-center'>
      <span className='mb-4 flex size-11 items-center justify-center rounded-xl bg-secondary text-primary'>
        <Icon name='clipboard-list' className='size-5' />
      </span>
      <h2 className='font-serif text-2xl font-medium text-brand'>
        {filtered ? 'Nenhum Intake encontrado' : 'Nenhum Intake registrado'}
      </h2>
      <p className='mt-2 max-w-md text-sm text-muted-foreground'>
        {filtered
          ? 'Ajuste os filtros ou limpe a busca para ver outras demandas.'
          : 'Registre a primeira demanda para começar a acompanhar a jornada do cliente.'}
      </p>
      {filtered ? (
        <Button type='button' variant='outline' className='mt-5' onClick={onClear}>
          Limpar filtros
        </Button>
      ) : (
        <Button asChild className='mt-5 rounded-full'>
          <Anchor route='newIntake'>Novo Intake</Anchor>
        </Button>
      )}
    </div>
  )
}

function IntakesPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPage,
}: {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPage: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label='Paginação de Intakes'
      className='flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-3 sm:flex-row sm:items-center sm:justify-between'
    >
      <span className='text-xs text-muted-foreground'>
        Exibindo {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}{' '}
        Intakes
      </span>
      <div className='flex gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <Icon name='chevron-left' /> Anterior
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Próxima <Icon name='chevron-right' />
        </Button>
      </div>
    </nav>
  )
}

function formatDate(value: Date | string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function contactChannelLabel(value: string) {
  return contactChannelOptions.find(([option]) => option === value)?.[1] ?? value
}
