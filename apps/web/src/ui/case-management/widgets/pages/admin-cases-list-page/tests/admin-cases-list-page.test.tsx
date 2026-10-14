import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { useAdminCasesListPage } from '../use-admin-cases-list-page'
import { AdminCasesListPage } from '..'

vi.mock('../use-admin-cases-list-page', () => ({
  useAdminCasesListPage: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, params, ...props }: AnchorProps) => (
    <a href={`/${route}/${params?.caseId ?? ''}`} {...props}>
      {children}
    </a>
  ),
}))

const useAdminCasesListPageMock = vi.mocked(useAdminCasesListPage)

describe('AdminCasesListPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useAdminCasesListPageMock.mockReturnValue({
      title: 'Meus casos',
      description: '{count} casos disponíveis para sua equipe',
      casesCount: 1,
      cases: [
        {
          id: 'admin-case-1',
          title: 'Caso administrativo',
          clientName: 'Cliente da equipe',
          publicCode: 'CASO-ADMIN-0001',
          legalArea: 'Cível',
          status: 'Documentação',
          nextAction: 'Revisar documentos',
          updatedAt: '08/10, 10:00',
          team: [],
          displayTeam: '',
          progress: { completedCount: 1, totalCount: 4, icon: 'file-text' },
          statusStyle: 'bg-muted',
        },
      ],
      emptyMessage: 'Nenhum caso cadastrado.',
      isLoadingCases: false,
      isCasesError: false,
      search: '',
      status: 'todos',
      area: 'todas',
      caseDetailsRoute: 'adminCaseDetails',
      showCreateCaseAction: false,
      pagination: { page: 1, totalPages: 2, onPageChange: vi.fn() },
      refetchCases: vi.fn(),
      handleSearchChange: vi.fn(),
      handleStatusChange: vi.fn(),
      handleAreaChange: vi.fn(),
    })
  })

  it('renders the shared case list with Admin page values', () => {
    render(<AdminCasesListPage />)

    expect(screen.getByRole('heading', { name: 'Meus casos' })).toBeDefined()
    expect(screen.getByText('1 casos disponíveis para sua equipe')).toBeDefined()
    expect(
      screen.getByRole('link', { name: /Caso administrativo/ }).getAttribute('href'),
    ).toBe('/adminCaseDetails/admin-case-1')
    expect(screen.queryByRole('link', { name: 'Abrir novo caso' })).toBeNull()
    expect(screen.getByText('Página 1 de 2')).toBeDefined()
  })
})
