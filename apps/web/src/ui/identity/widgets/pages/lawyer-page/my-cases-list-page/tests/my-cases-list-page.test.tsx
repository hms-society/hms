import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { LawyerCasesListPage } from '..'
import { useMyCasesListPage } from '../use-my-cases-list-page'

vi.mock('../use-my-cases-list-page', () => ({
  useMyCasesListPage: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params, ...props }: AnchorProps) => (
    <a href={`/advogado/meus-casos/${params?.caseId ?? ''}`} {...props}>
      {children}
    </a>
  ),
}))

const useMyCasesListPageMock = vi.mocked(useMyCasesListPage)

describe('LawyerCasesListPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the current lawyer case list as route links', () => {
    useMyCasesListPageMock.mockReturnValue({
      area: 'todas',
      cases: [
        {
          id: 'case-1',
          title: 'Aposentadoria por Tempo de Contribuição',
          clientName: 'Antônio Carvalho',
          publicCode: 'CASO-20260703-0089',
          legalArea: 'Direito Previdenciário',
          status: 'Em formação',
          priority: 'Normal',
          nextAction: 'Aprovar solicitação assistida de documentos',
          updatedAt: 'Hoje, 09:42',
          team: [
            {
              collaboratorId: 'collab-ricardo-mendes',
              initials: 'RM',
              name: 'Dr. Ricardo Mendes',
              role: 'Advogado principal',
              className: 'bg-primary text-primary-foreground',
            },
          ],
          progress: {
            completedCount: 0,
            totalCount: 7,
            icon: 'file-text',
          },
          displayTeam: 'Dr. Ricardo Mendes',
          statusStyle: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
        },
      ],
      handleAreaChange: vi.fn(),
      handleSearchChange: vi.fn(),
      handleStatusChange: vi.fn(),
      isCasesError: false,
      isLoadingCases: false,
      search: '',
      status: 'todos',
      total: 1,
    })

    render(<LawyerCasesListPage />)

    expect(screen.getByRole('heading', { name: 'Meus casos' })).toBeDefined()
    expect(screen.getByText('1 casos disponíveis para sua equipe')).toBeDefined()
    const caseLink = screen.getByRole('link', {
      name: /Aposentadoria por Tempo de Contribuição/i,
    })
    expect(caseLink.getAttribute('href')).toBe('/advogado/meus-casos/case-1')
    expect(screen.getByText('Antônio Carvalho')).toBeDefined()
    expect(screen.getByText('Em formação')).toBeDefined()
  })

  it('delegates search changes to the page controller', () => {
    const handleSearchChange = vi.fn()

    useMyCasesListPageMock.mockReturnValue({
      area: 'todas',
      cases: [],
      handleAreaChange: vi.fn(),
      handleSearchChange,
      handleStatusChange: vi.fn(),
      isCasesError: false,
      isLoadingCases: false,
      search: '',
      status: 'todos',
      total: 0,
    })

    render(<LawyerCasesListPage />)

    fireEvent.change(
      screen.getByPlaceholderText('Buscar por caso, cliente, código ou área jurídica...'),
      { target: { value: 'tributário' } },
    )

    expect(handleSearchChange).toHaveBeenCalledWith('tributário')
    expect(screen.getByText('Nenhum caso encontrado.')).toBeDefined()
  })
})
