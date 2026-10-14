import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { CaseDetailsRoute, CaseListPageItem } from './types'

export type CasesListPageProps = {
  title: string
  description: string
  casesCount: number
  cases: readonly CaseListPageItem[]
  emptyMessage?: string
  isLoadingCases: boolean
  isCasesError: boolean
  search: string
  searchPlaceholder?: string
  filterNote?: string
  status: string
  area: string
  caseDetailsRoute: CaseDetailsRoute
  showCreateCaseAction?: boolean
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  refetchCases: () => unknown
  handleSearchChange: (value: string) => void
  handleStatusChange: (value: string) => void
  handleAreaChange: (value: string) => void
}

const STATUS_FILTERS = [
  ['documentation', 'Documentação'],
  ['ready_for_legal_production', 'Em andamento'],
  ['legal_production', 'Em produção jurídica'],
  ['protocol_delivery', 'Protocolo e entrega'],
  ['execution', 'Execução'],
  ['closed', 'Encerrado'],
] as const

const AREA_FILTERS = [
  'Administrativo',
  'Cível',
  'Família',
  'Trabalhista',
  'Previdenciário',
] as const

export const CasesListPage = (props: CasesListPageProps) => {
  return (
    <main className='mt-12 flex w-full flex-col gap-8'>
      <CasesListContent {...props} />
    </main>
  )
}

function CasesListContent(props: CasesListPageProps) {
  return (
    <>
      <CasesListToolbar {...props} />
      <CasesTable {...props} />
      {props.pagination && <CasesPagination pagination={props.pagination} />}
    </>
  )
}

function CasesListToolbar(props: CasesListPageProps) {
  return (
    <>
      <CasesListHeader {...props} />
      <CasesListControls {...props} />
    </>
  )
}

function CasesListControls(props: CasesListPageProps) {
  return (
    <>
      <CasesSearch {...props} />
      <CasesFilters {...props} />
      {props.filterNote && (
        <p className='text-sm text-muted-foreground'>{props.filterNote}</p>
      )}
    </>
  )
}

function CasesListHeader({
  title,
  description,
  casesCount,
  showCreateCaseAction,
}: Pick<
  CasesListPageProps,
  'title' | 'description' | 'casesCount' | 'showCreateCaseAction'
>) {
  return (
    <div className='flex flex-col justify-between gap-5 sm:flex-row sm:items-center'>
      <CasesListHeading title={title} description={description} casesCount={casesCount} />
      {showCreateCaseAction && <CasesCreateAction />}
    </div>
  )
}

function CasesListHeading({
  title,
  description,
  casesCount,
}: Pick<CasesListPageProps, 'title' | 'description' | 'casesCount'>) {
  return (
    <div>
      <h1 className='font-serif text-[28px] font-semibold text-foreground'>{title}</h1>
      <p className='mt-1 text-[14px] text-muted-foreground'>
        {description.replace('{count}', String(casesCount))}
      </p>
    </div>
  )
}

function CasesCreateAction() {
  return (
    <Anchor route='lawyerCaseCreation'>
      <Button className='rounded-full px-6 py-2'>Abrir novo caso</Button>
    </Anchor>
  )
}

function CasesSearch(props: CasesListPageProps) {
  return (
    <div className='relative'>
      <CasesSearchIcon />
      <CasesSearchInput
        search={props.search}
        onChange={props.handleSearchChange}
        placeholder={props.searchPlaceholder}
      />
    </div>
  )
}

function CasesSearchIcon() {
  return (
    <Icon
      name='search'
      className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
    />
  )
}

function CasesSearchInput({
  search,
  onChange,
  placeholder,
}: {
  search: string
  onChange: CasesListPageProps['handleSearchChange']
  placeholder?: string
}) {
  return (
    <Input
      value={search}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder ?? 'Buscar por caso, cliente, código ou área jurídica...'}
      className='h-11 border-border/60 bg-card pl-10 text-[14px] shadow-sm'
    />
  )
}

function CasesFilters(props: CasesListPageProps) {
  return (
    <div className='flex flex-wrap items-center gap-4'>
      <span className='mr-1 text-[14px] text-muted-foreground'>Filtros</span>
      <CaseStatusFilter value={props.status} onChange={props.handleStatusChange} />
      <CaseAreaFilter value={props.area} onChange={props.handleAreaChange} />
    </div>
  )
}

function CaseStatusFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <CasesFilterSelect
      value={value}
      onChange={onChange}
      placeholder='Status do caso'
      defaultOption={['todos', 'Todos os status']}
      options={STATUS_FILTERS}
      width='w-[190px]'
    />
  )
}

function CaseAreaFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <CasesFilterSelect
      value={value}
      onChange={onChange}
      placeholder='Área jurídica'
      defaultOption={['todas', 'Todas as áreas']}
      options={AREA_FILTERS.map((legalArea) => [legalArea, legalArea] as const)}
      width='w-[220px]'
    />
  )
}

function CasesFilterSelect({
  value,
  onChange,
  placeholder,
  defaultOption,
  options,
  width,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  defaultOption: readonly [string, string]
  options: readonly (readonly [string, string])[]
  width: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <CasesFilterTrigger placeholder={placeholder} width={width} />
      <CasesFilterOptions defaultOption={defaultOption} options={options} />
    </Select>
  )
}

function CasesFilterTrigger({
  placeholder,
  width,
}: {
  placeholder: string
  width: string
}) {
  return (
    <SelectTrigger
      className={`h-10 ${width} border-border/60 bg-card text-[12px] shadow-sm`}
    >
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
  )
}

function CasesFilterOptions({
  defaultOption,
  options,
}: {
  defaultOption: readonly [string, string]
  options: readonly (readonly [string, string])[]
}) {
  return (
    <SelectContent>
      <SelectItem value={defaultOption[0]}>{defaultOption[1]}</SelectItem>
      {options.map(([optionValue, label]) => (
        <SelectItem key={optionValue} value={optionValue}>
          {label}
        </SelectItem>
      ))}
    </SelectContent>
  )
}

type CasesTableProps = Pick<
  CasesListPageProps,
  | 'cases'
  | 'emptyMessage'
  | 'isLoadingCases'
  | 'isCasesError'
  | 'caseDetailsRoute'
  | 'refetchCases'
>

function CasesTable(props: CasesTableProps) {
  return (
    <div className='overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm'>
      <Table>
        <CasesTableHeader />
        <CasesTableBody {...props} />
      </Table>
    </div>
  )
}

function CasesTableHeader() {
  return (
    <TableHeader>
      <TableRow className='hover:bg-transparent'>
        {CASE_LIST_COLUMNS.map((label) => (
          <TableHead
            key={label}
            className='h-12 px-4 text-[12px] font-medium text-muted-foreground'
          >
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

const CASE_LIST_COLUMNS = [
  'Caso',
  'Cliente',
  'Status',
  'Checklist',
  'Equipe',
  'Próxima ação',
]

function CasesTableBody(props: CasesTableProps) {
  return getCasesTableState(props) ?? <CasesTableRows {...props} />
}

function CasesTableRows({ cases, caseDetailsRoute }: CasesTableProps) {
  return (
    <TableBody>
      {cases.map((caseItem) => (
        <CaseListRow
          key={caseItem.id}
          caseItem={caseItem}
          caseDetailsRoute={caseDetailsRoute}
        />
      ))}
    </TableBody>
  )
}

function getCasesTableState(props: CasesTableProps) {
  if (props.isLoadingCases) return <CasesTableMessage message='Carregando casos...' />
  if (props.isCasesError) return <CasesTableError refetchCases={props.refetchCases} />
  return props.cases.length ? null : (
    <CasesTableMessage message={props.emptyMessage ?? 'Nenhum caso encontrado.'} />
  )
}

function CasesTableError({ refetchCases }: Pick<CasesTableProps, 'refetchCases'>) {
  return (
    <TableBody>
      <TableRow>
        <CasesTableErrorCell refetchCases={refetchCases} />
      </TableRow>
    </TableBody>
  )
}

function CasesTableErrorCell({ refetchCases }: Pick<CasesTableProps, 'refetchCases'>) {
  return (
    <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
      <span role='alert' className='block'>
        Não foi possível carregar os casos.
      </span>
      <CasesTableRetryButton onRetry={refetchCases} />
    </TableCell>
  )
}

function CasesTableRetryButton({
  onRetry,
}: {
  onRetry: CasesTableProps['refetchCases']
}) {
  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      className='mt-2 rounded-full'
      onClick={() => void onRetry()}
    >
      Tentar novamente
    </Button>
  )
}

function CasesTableMessage({ message }: { message: string }) {
  return (
    <TableBody>
      <TableRow>
        <CasesTableMessageCell message={message} />
      </TableRow>
    </TableBody>
  )
}

function CasesTableMessageCell({ message }: { message: string }) {
  return (
    <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
      <span role={message.startsWith('Carregando') ? undefined : 'status'}>
        {message}
      </span>
    </TableCell>
  )
}

function CaseListRow({
  caseItem,
  caseDetailsRoute,
}: Pick<CasesListPageProps, 'caseDetailsRoute'> & { caseItem: CaseListPageItem }) {
  return (
    <TableRow className='cursor-pointer'>
      <CaseSummaryCell caseItem={caseItem} caseDetailsRoute={caseDetailsRoute} />
      <CaseClientCell caseItem={caseItem} />
      <CaseStatusCell caseItem={caseItem} />
      <CaseProgressCell caseItem={caseItem} />
      <CaseTeamCell caseItem={caseItem} />
      <CaseNextActionCell caseItem={caseItem} />
    </TableRow>
  )
}

function CaseClientCell({ caseItem }: { caseItem: CaseListPageItem }) {
  return (
    <TableCell className='max-w-[140px] truncate px-4 py-4 align-top text-[12px] leading-6 text-muted-foreground'>
      {caseItem.clientName}
    </TableCell>
  )
}

function CaseStatusCell({ caseItem }: { caseItem: CaseListPageItem }) {
  return (
    <TableCell className='px-4 py-4 align-top'>
      <Badge
        variant='secondary'
        className={`whitespace-nowrap border-transparent px-3 py-1 text-[12px] font-medium shadow-none ${caseItem.statusStyle}`}
      >
        {caseItem.status}
      </Badge>
    </TableCell>
  )
}

function CaseSummaryCell({
  caseItem,
  caseDetailsRoute,
}: Pick<CasesListPageProps, 'caseDetailsRoute'> & { caseItem: CaseListPageItem }) {
  return (
    <TableCell className='w-[28%] max-w-0 px-4 py-4 align-top'>
      <CaseSummaryLink caseItem={caseItem} caseDetailsRoute={caseDetailsRoute} />
    </TableCell>
  )
}

function CaseSummaryLink({
  caseItem,
  caseDetailsRoute,
}: Pick<CasesListPageProps, 'caseDetailsRoute'> & { caseItem: CaseListPageItem }) {
  return (
    <Anchor
      route={caseDetailsRoute}
      params={{ caseId: caseItem.id }}
      className='flex min-w-0 flex-col gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
    >
      <CaseSummaryContent caseItem={caseItem} />
    </Anchor>
  )
}

function CaseSummaryContent({ caseItem }: { caseItem: CaseListPageItem }) {
  return (
    <>
      <CaseSummaryTitle title={caseItem.title} />
      <CaseSummaryCode code={caseItem.publicCode} area={caseItem.legalArea} />
    </>
  )
}

function CaseSummaryTitle({ title }: { title: string }) {
  return (
    <span className='block truncate text-[14px] font-semibold leading-6 text-foreground'>
      {title}
    </span>
  )
}

function CaseSummaryCode({ code, area }: { code: string; area: string }) {
  return (
    <span className='flex items-center gap-1.5 truncate text-[12px] leading-5 text-muted-foreground'>
      <Icon name='tag' className='size-3.5 shrink-0' />
      <span className='truncate'>
        {code} · {area}
      </span>
    </span>
  )
}

function CaseProgressCell({ caseItem }: { caseItem: CaseListPageItem }) {
  return (
    <TableCell className='whitespace-nowrap px-4 py-4 align-top text-[12px] leading-6 text-muted-foreground'>
      <CaseProgress progress={caseItem.progress} />
    </TableCell>
  )
}

function CaseProgress({ progress }: { progress: CaseListPageItem['progress'] }) {
  return (
    <span className='flex items-center gap-2.5'>
      {progress ? <CaseProgressValue progress={progress} /> : <CaseProgressMissing />}
    </span>
  )
}

function CaseProgressValue({
  progress,
}: {
  progress: NonNullable<CaseListPageItem['progress']>
}) {
  return (
    <>
      <Icon name={progress.icon} className='size-5 shrink-0' />
      {progress.completedCount}/{progress.totalCount}
    </>
  )
}

function CaseProgressMissing() {
  return (
    <span role='img' aria-label='Progresso não informado'>
      —
    </span>
  )
}

function CaseTeamCell({ caseItem }: { caseItem: CaseListPageItem }) {
  return (
    <TableCell className='px-4 py-4 align-top'>
      <div className='flex items-center gap-2'>
        <CaseTeamAvatars caseItem={caseItem} />
        <CaseTeamNames names={caseItem.displayTeam} />
      </div>
    </TableCell>
  )
}

function CaseTeamNames({ names }: { names: string }) {
  return <span className='sr-only'>{names}</span>
}

function CaseTeamAvatars({ caseItem }: { caseItem: CaseListPageItem }) {
  return (
    <div className='flex -space-x-1.5'>
      {caseItem.team.map((member) => (
        <CaseTeamAvatar key={`${caseItem.id}-${member.collaboratorId}`} member={member} />
      ))}
    </div>
  )
}

function CaseTeamAvatar({ member }: { member: CaseListPageItem['team'][number] }) {
  return (
    <Avatar className='size-8 border-2 border-card'>
      <AvatarFallback
        className={`${member.className} text-[10px]`}
        title={`${member.name} - ${member.role}`}
      >
        {member.initials}
      </AvatarFallback>
    </Avatar>
  )
}

function CaseNextActionCell({ caseItem }: { caseItem: CaseListPageItem }) {
  return (
    <TableCell className='max-w-[200px] px-4 py-4 align-top text-muted-foreground'>
      <div className='flex min-w-0 flex-col gap-2'>
        <CaseNextAction action={caseItem.nextAction} updatedAt={caseItem.updatedAt} />
      </div>
    </TableCell>
  )
}

function CaseNextAction({
  action,
  updatedAt,
}: {
  action: string | undefined
  updatedAt: string
}) {
  return (
    <>
      <span className='block truncate text-[12px] leading-5'>{action ?? '—'}</span>
      <span className='text-[12px] leading-5'>{updatedAt}</span>
    </>
  )
}

function CasesPagination({ pagination }: Pick<CasesListPageProps, 'pagination'>) {
  if (!pagination || pagination.totalPages <= 1) return null
  return (
    <div className='flex items-center justify-end gap-2'>
      <PaginationControl pagination={pagination} direction='previous' />
      <PaginationPageNumber pagination={pagination} />
      <PaginationControl pagination={pagination} direction='next' />
    </div>
  )
}

function PaginationPageNumber({
  pagination,
}: {
  pagination: NonNullable<CasesListPageProps['pagination']>
}) {
  return (
    <span className='text-sm text-muted-foreground'>
      Página {pagination.page} de {pagination.totalPages}
    </span>
  )
}

function PaginationControl({
  pagination,
  direction,
}: {
  pagination: NonNullable<CasesListPageProps['pagination']>
  direction: 'previous' | 'next'
}) {
  const [label, isDisabled, targetPage] = getPaginationControl(pagination, direction)
  return (
    <Button
      {...PAGINATION_BUTTON_PROPS}
      disabled={isDisabled}
      onClick={() => pagination.onPageChange(targetPage)}
    >
      {label}
    </Button>
  )
}

function getPaginationControl(
  pagination: NonNullable<CasesListPageProps['pagination']>,
  direction: 'previous' | 'next',
) {
  const config = PAGINATION_DIRECTIONS[direction]
  return [
    config.label,
    config.isDisabled(pagination.page, pagination.totalPages),
    pagination.page + config.step,
  ] as const
}

const PAGINATION_DIRECTIONS = {
  previous: {
    label: 'Anterior',
    step: -1,
    isDisabled: (page: number, _totalPages: number) => page <= 1,
  },
  next: {
    label: 'Próxima',
    step: 1,
    isDisabled: (page: number, totalPages: number) => page >= totalPages,
  },
} as const

const PAGINATION_BUTTON_PROPS = {
  type: 'button',
  variant: 'outline',
  size: 'sm',
  className: 'rounded-full',
} as const
