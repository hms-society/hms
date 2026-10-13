import { act, renderHook } from '@testing-library/react'
import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAdminCasesQuery } from '@/ui/case-management/hooks/use-admin-cases-query'
import { useAdminCasesListPage } from '../use-admin-cases-list-page'

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  search: { page: 2, pageSize: 20, search: 'client' } as {
    page: number
    pageSize: number
    search?: string
  },
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => routerMocks.navigate,
  useSearch: () => routerMocks.search,
}))

vi.mock('@/ui/case-management/hooks/use-admin-cases-query', () => ({
  useAdminCasesQuery: vi.fn(),
}))

const useAdminCasesQueryMock = vi.mocked(useAdminCasesQuery)

const cases = [
  {
    id: 'case-open',
    publicCode: 'CASE-OPEN',
    title: 'Contrato aberto',
    clientName: 'Cliente A',
    legalArea: 'Cível',
    legalTopic: 'Contratos',
    status: LegalCaseStatus.Documentation,
    managerNames: ['Maria Oliveira', 'João Silva', 'Ana Reis', 'Paulo Lima', 'Extra'],
    updatedAt: new Date('2026-10-08T12:30:00.000Z'),
  },
  {
    id: 'case-closed',
    publicCode: 'CASE-CLOSED',
    title: 'Caso encerrado',
    clientName: 'Cliente B',
    legalArea: 'Trabalhista',
    legalTopic: 'Rescisão',
    status: LegalCaseStatus.Closed,
    managerNames: [],
    updatedAt: new Date('2026-10-07T09:00:00.000Z'),
  },
]

describe('useAdminCasesListPage', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    routerMocks.search = { page: 2, pageSize: 20, search: 'client' }
    useAdminCasesQueryMock.mockReturnValue({
      data: { items: cases, total: 31, page: 2, totalPages: 2 },
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)
  })

  it('projects operational cases and applies local status and area filters', () => {
    const { result } = renderHook(() => useAdminCasesListPage())

    expect(result.current.title).toBe('Meus casos')
    expect(result.current.caseDetailsRoute).toBe('adminCaseDetails')
    expect(result.current.showCreateCaseAction).toBe(false)
    expect(result.current.casesCount).toBe(31)
    expect(result.current.cases[0]).toMatchObject({
      id: 'case-open',
      status: 'Documentação',
      displayTeam: 'Maria Oliveira, João Silva, Ana Reis, Paulo Lima, Extra',
      team: [
        { initials: 'MO', role: 'manager' },
        { initials: 'JS', role: 'manager' },
        { initials: 'AR', role: 'manager' },
        { initials: 'PL', role: 'manager' },
        { initials: 'E', role: 'manager' },
      ],
    })
    expect(result.current.pagination).toMatchObject({ page: 2, totalPages: 2 })
    expect(useAdminCasesQueryMock).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      search: 'client',
    })

    act(() => result.current.handleStatusChange(LegalCaseStatus.Closed))
    expect(result.current.cases.map((item) => item.id)).toEqual(['case-closed'])
    expect(result.current.casesCount).toBe(1)

    act(() => result.current.handleAreaChange('Cível'))
    expect(result.current.cases).toEqual([])
    expect(result.current.emptyMessage).toBe(
      'Nenhum caso corresponde aos filtros selecionados.',
    )
  })

  it('syncs trimmed search to the route and resets pagination', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useAdminCasesListPage())

    act(() => result.current.handleSearchChange('  new client  '))
    expect(routerMocks.navigate).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(250))

    expect(routerMocks.navigate).toHaveBeenCalledOnce()
    const navigation = routerMocks.navigate.mock.calls[0][0]
    expect(navigation).toMatchObject({ replace: true })
    expect(navigation.search(routerMocks.search)).toEqual({
      page: 1,
      pageSize: 20,
      search: 'new client',
    })
  })

  it('uses query state for loading, errors, pagination fallback, and empty messages', () => {
    const refetch = vi.fn()
    useAdminCasesQueryMock.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: true,
      refetch,
    } as never)
    const { result } = renderHook(() => useAdminCasesListPage())

    expect(result.current.isCasesError).toBe(true)
    expect(result.current.isLoadingCases).toBe(true)
    expect(result.current.cases).toEqual([])
    expect(result.current.casesCount).toBe(0)
    const pagination = result.current.pagination
    if (!pagination) throw new Error('Admin case pagination should be available')
    expect(pagination).toMatchObject({ page: 2, totalPages: 0 })
    expect(result.current.emptyMessage).toBe('Nenhum caso corresponde à busca.')
    act(() => result.current.refetchCases())
    expect(refetch).toHaveBeenCalledOnce()

    act(() => result.current.handleSearchChange(''))
    expect(result.current.emptyMessage).toBe('Nenhum caso cadastrado.')
  })

  it('writes the requested page through route navigation', () => {
    const { result } = renderHook(() => useAdminCasesListPage())

    const pagination = result.current.pagination
    if (!pagination) throw new Error('Admin case pagination should be available')
    act(() => pagination.onPageChange(3))

    expect(routerMocks.navigate).toHaveBeenCalledWith({
      replace: true,
      search: expect.any(Function),
    })
    expect(routerMocks.navigate.mock.calls[0][0].search(routerMocks.search)).toEqual({
      ...routerMocks.search,
      page: 3,
    })
  })
})
