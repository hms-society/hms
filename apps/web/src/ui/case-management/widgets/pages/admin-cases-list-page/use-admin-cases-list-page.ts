import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  CaseMemberRole,
  LegalCaseStatus,
} from '@hms/core/case-management/domain/structures'
import type { LegalCaseOperationalSummary } from '@hms/core/case-management/domain/entities'
import type { AdminCasesQueryData } from '@hms/validation/case-management'

import type { CaseListPageItem } from '../cases-list-page/types'
import type { CasesListPageProps } from '../cases-list-page'
import { useAdminCasesQuery } from '@/ui/case-management/hooks/use-admin-cases-query'

const STATUS_LABELS = {
  [LegalCaseStatus.Documentation]: 'Documentação',
  [LegalCaseStatus.ReadyForLegalProduction]: 'Em andamento',
  [LegalCaseStatus.LegalProduction]: 'Em produção jurídica',
  [LegalCaseStatus.ProtocolDelivery]: 'Protocolo e entrega',
  [LegalCaseStatus.Execution]: 'Execução',
  [LegalCaseStatus.Closed]: 'Encerrado',
} as const

const STATUS_STYLES = {
  [LegalCaseStatus.Documentation]: 'bg-accent text-accent-foreground hover:bg-accent',
  [LegalCaseStatus.ReadyForLegalProduction]:
    'bg-highlight text-highlight-foreground hover:bg-highlight',
  [LegalCaseStatus.LegalProduction]:
    'bg-secondary text-secondary-foreground hover:bg-secondary',
  [LegalCaseStatus.ProtocolDelivery]: 'bg-muted text-foreground hover:bg-muted',
  [LegalCaseStatus.Execution]: 'bg-accent text-accent-foreground hover:bg-accent',
  [LegalCaseStatus.Closed]: 'bg-muted text-muted-foreground hover:bg-muted',
} as const

const ADMIN_CASES_LIST_PAGE_PROPS = {
  title: 'Meus casos',
  description: '{count} casos disponíveis para sua equipe',
  caseDetailsRoute: 'adminCaseDetails',
  showCreateCaseAction: false,
  searchPlaceholder: 'Buscar por caso, cliente ou código...',
  filterNote: 'Filtros de status e área se aplicam aos casos desta página.',
} as const

export function useAdminCasesListPage(): CasesListPageProps {
  return createAdminCasesListPageProps(useAdminCasesListState())
}

function useAdminCasesListState() {
  const query = useSearch({ from: '/admin/casos/' })
  const filters = useAdminCaseListFilters(query.search)
  return useAdminCaseListData(query, filters)
}

function useAdminCaseListData(
  query: Parameters<typeof useAdminCasesQuery>[0],
  filters: ReturnType<typeof useAdminCaseListFilters>,
) {
  const response = useAdminCasesQuery(query)
  return {
    filters,
    result: getAdminCasesListQueryResult(response, filters),
    pagination: useAdminCasesPagination(query.page, response.data),
    response,
  }
}

function getAdminCasesListQueryResult(
  response: ReturnType<typeof useAdminCasesQuery>,
  filters: ReturnType<typeof useAdminCaseListFilters>,
) {
  return getAdminCasesListResult(
    response.data?.items ?? [],
    response.data?.total ?? 0,
    filters,
  )
}

function createAdminCasesListPageProps(
  state: ReturnType<typeof useAdminCasesListState>,
): CasesListPageProps {
  return {
    ...ADMIN_CASES_LIST_PAGE_PROPS,
    ...state.filters,
    ...state.result,
    ...getAdminCasesListQueryProps(state.response),
    pagination: state.pagination,
  }
}

function getAdminCasesListQueryProps(response: ReturnType<typeof useAdminCasesQuery>) {
  return {
    refetchCases: response.refetch,
    isCasesError: response.isError,
    isLoadingCases: response.isPending,
  }
}

function useAdminCasesPagination(
  queryPage: number,
  data: ReturnType<typeof useAdminCasesQuery>['data'],
) {
  const navigate = useNavigate({ from: '/admin/casos/' })
  return {
    page: data?.page ?? queryPage,
    totalPages: data?.totalPages ?? 0,
    onPageChange: (page: number) =>
      void navigate({ replace: true, search: (previous) => ({ ...previous, page }) }),
  }
}

function useAdminCaseListFilters(querySearch?: string) {
  const [status, setStatus] = useState('todos')
  const [area, setArea] = useState('todas')
  const search = useAdminCaseSearch(querySearch)
  return createAdminCaseListFilterProps(search, area, setArea, status, setStatus)
}

function createAdminCaseListFilterProps(
  search: ReturnType<typeof useAdminCaseSearch>,
  area: string,
  setArea: (value: string) => void,
  status: string,
  setStatus: (value: string) => void,
) {
  return {
    ...search,
    area,
    handleAreaChange: setArea,
    handleStatusChange: setStatus,
    status,
  }
}

function useAdminCaseSearch(querySearch?: string) {
  const [search, setSearch] = useState(querySearch ?? '')
  useEffect(() => setSearch(querySearch ?? ''), [querySearch])
  useAdminCaseSearchSync(search, querySearch)
  return { search, handleSearchChange: setSearch }
}

function useAdminCaseSearchSync(search: string, querySearch?: string) {
  const updateSearch = useAdminCaseSearchUpdater()
  useEffect(
    () => scheduleAdminCaseSearchSync(search, querySearch, updateSearch),
    [querySearch, search, updateSearch],
  )
}

function useAdminCaseSearchUpdater() {
  const navigate = useNavigate({ from: '/admin/casos/' })
  return useCallback(
    (normalizedSearch: string) =>
      void navigate({
        replace: true,
        search: (previous) => getAdminCasesSearch(previous, normalizedSearch),
      }),
    [navigate],
  )
}

function getAdminCasesSearch(previous: AdminCasesQueryData, search: string) {
  return { ...previous, page: 1, search: search || undefined }
}

function scheduleAdminCaseSearchSync(
  search: string,
  querySearch: string | undefined,
  updateSearch: (value: string) => void,
) {
  const normalizedSearch = search.trim()
  if (normalizedSearch === (querySearch ?? '')) return undefined
  const timeout = window.setTimeout(() => updateSearch(normalizedSearch), 250)
  return () => window.clearTimeout(timeout)
}

function getAdminCasesListResult(
  items: readonly LegalCaseOperationalSummary[],
  total: number,
  filters: { status: string; area: string; search: string },
) {
  const cases = items
    .map(projectAdminCase)
    .filter((caseItem) => matchesAdminCaseFilters(caseItem, filters))
  return createAdminCasesListResult(cases, total, filters)
}

function createAdminCasesListResult(
  cases: readonly CaseListPageItem[],
  total: number,
  filters: { status: string; area: string; search: string },
) {
  return {
    cases,
    casesCount: getAdminCasesCount(cases, total, filters),
    emptyMessage: getAdminCasesEmptyMessage(filters),
  }
}

function matchesAdminCaseFilters(
  caseItem: CaseListPageItem,
  filters: { status: string; area: string },
) {
  return (
    (filters.status === 'todos' || caseItem.statusValue === filters.status) &&
    (filters.area === 'todas' || caseItem.legalArea === filters.area)
  )
}

function getAdminCasesCount(
  cases: readonly CaseListPageItem[],
  total: number,
  filters: { status: string; area: string },
) {
  return filters.status === 'todos' && filters.area === 'todas' ? total : cases.length
}

function getAdminCasesEmptyMessage(filters: {
  status: string
  area: string
  search: string
}) {
  if (filters.status !== 'todos' || filters.area !== 'todas')
    return 'Nenhum caso corresponde aos filtros selecionados.'
  return filters.search.trim()
    ? 'Nenhum caso corresponde à busca.'
    : 'Nenhum caso cadastrado.'
}

function projectAdminCase(caseItem: LegalCaseOperationalSummary): CaseListPageItem {
  return {
    ...getAdminCaseDetails(caseItem),
    ...getAdminCaseStatus(caseItem),
    ...getAdminCaseTeam(caseItem),
  }
}

function getAdminCaseDetails(caseItem: LegalCaseOperationalSummary) {
  return {
    id: caseItem.id,
    title: caseItem.title,
    clientName: caseItem.clientName,
    publicCode: caseItem.publicCode,
    legalArea: caseItem.legalArea,
  }
}

function getAdminCaseStatus(caseItem: LegalCaseOperationalSummary) {
  return {
    statusValue: caseItem.status,
    status: STATUS_LABELS[caseItem.status],
    updatedAt: formatUpdatedAt(caseItem.updatedAt),
    statusStyle: STATUS_STYLES[caseItem.status],
  }
}

function getAdminCaseTeam(caseItem: LegalCaseOperationalSummary) {
  const team = caseItem.managerNames.map((name, index) => ({
    collaboratorId: `${caseItem.id}-manager-${index}`,
    initials: getInitials(name),
    name,
    role: CaseMemberRole.Manager,
    className: getTeamMemberClassName(index),
  }))
  return { team, displayTeam: team.map((member) => member.name).join(', ') }
}

function formatUpdatedAt(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function getTeamMemberClassName(index: number) {
  const classes = [
    'bg-primary text-primary-foreground',
    'bg-accent text-accent-foreground',
    'bg-highlight text-highlight-foreground',
    'bg-muted text-foreground',
  ]

  return classes[index % classes.length] ?? classes[0]
}
