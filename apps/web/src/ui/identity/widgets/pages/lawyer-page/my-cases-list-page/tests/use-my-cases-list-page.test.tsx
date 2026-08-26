import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useMyCasesListPage } from '../use-my-cases-list-page'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('useMyCasesListPage', () => {
  const caseManagementService = {
    listMyCases: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    caseManagementService.listMyCases.mockResolvedValue({
      body: [
        {
          id: 'case-1',
          publicCode: 'CASO-20260825-0001',
          title: 'Revisao contratual',
          status: LegalCaseStatus.Documentation,
          clientName: 'Cliente HMS Teste',
          legalArea: 'Cível',
          legalTopic: 'Contratos',
          openedAt: '2026-08-25T12:00:00.000Z',
          updatedAt: '2026-08-25T12:30:00.000Z',
          version: 1,
          checklistGate: {},
          dossierGate: {},
          team: [
            {
              collaboratorId: 'collaborator-1',
              name: 'Advogado de desenvolvimento',
              role: 'lead_lawyer',
              isPrimary: true,
            },
          ],
        },
        {
          id: 'case-2',
          publicCode: 'CASO-20260825-0002',
          title: 'Defesa em execução fiscal',
          status: LegalCaseStatus.ReadyForLegalProduction,
          clientName: 'Empresa HMS Teste',
          legalArea: 'Tributário',
          legalTopic: 'Execução fiscal',
          openedAt: '2026-08-25T12:00:00.000Z',
          updatedAt: '2026-08-25T13:30:00.000Z',
          version: 2,
          checklistGate: { decision: 'approved' },
          dossierGate: {},
          team: [
            {
              collaboratorId: 'collaborator-1',
              name: 'Advogado de desenvolvimento',
              role: 'lead_lawyer',
              isPrimary: true,
            },
          ],
        },
      ],
    })
    useRestContextMock.mockReturnValue({ caseManagementService } as never)
  })

  it('lists cases returned by the case management service', async () => {
    const { result } = renderHook(() => useMyCasesListPage(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.total).toBe(2))

    expect(caseManagementService.listMyCases).toHaveBeenCalledOnce()
    expect(result.current.cases.map((caseItem) => caseItem.publicCode)).toEqual([
      'CASO-20260825-0001',
      'CASO-20260825-0002',
    ])
  })

  it('filters visible cases by search text', async () => {
    const { result } = renderHook(() => useMyCasesListPage(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.total).toBe(2))

    act(() => {
      result.current.handleSearchChange('execução fiscal')
    })

    expect(result.current.total).toBe(1)
    expect(result.current.cases[0].title).toBe('Defesa em execução fiscal')
  })

  it('combines status and legal area filters', async () => {
    const { result } = renderHook(() => useMyCasesListPage(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.total).toBe(2))

    act(() => {
      result.current.handleStatusChange('Em formação')
      result.current.handleAreaChange('Cível')
    })

    expect(result.current.total).toBe(1)
    expect(result.current.cases[0].clientName).toBe('Cliente HMS Teste')
    expect(result.current.cases[0].displayTeam).toContain('Advogado de desenvolvimento')
  })
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
