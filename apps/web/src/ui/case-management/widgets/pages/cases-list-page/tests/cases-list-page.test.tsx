import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { CasesListPage, type CasesListPageProps } from '..'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, params, ...props }: AnchorProps) => (
    <a href={`/${route}/${params?.caseId ?? ''}`} data-route={route} {...props}>
      {children}
    </a>
  ),
}))

function createCase(overrides: Partial<CasesListPageProps['cases'][number]> = {}) {
  return {
    id: 'case-1',
    title: 'Revisão contratual',
    clientName: 'Kauan Domingues de Souza',
    publicCode: 'CASO-20261007-0001',
    legalArea: 'Cível',
    status: 'Documentação',
    nextAction: 'Revisar checklist de documentos',
    updatedAt: '07/10, 16:20',
    team: [
      {
        collaboratorId: 'collaborator-1',
        initials: 'AD',
        name: 'Advogado de desenvolvimento',
        role: 'Gestor',
        className: 'bg-primary',
      },
    ],
    progress: { completedCount: 2, totalCount: 7, icon: 'file-text' as const },
    displayTeam: 'Advogado de desenvolvimento',
    statusStyle: 'bg-muted',
    ...overrides,
  }
}

function createPageProps(
  overrides: Partial<CasesListPageProps> = {},
): CasesListPageProps {
  return {
    title: 'Meus casos',
    description: '{count} casos disponíveis para sua equipe',
    casesCount: 1,
    cases: [createCase()],
    isLoadingCases: false,
    isCasesError: false,
    search: '',
    status: 'todos',
    area: 'todas',
    caseDetailsRoute: 'lawyerCaseDetails',
    refetchCases: vi.fn(),
    handleSearchChange: vi.fn(),
    handleStatusChange: vi.fn(),
    handleAreaChange: vi.fn(),
    ...overrides,
  }
}

describe('CasesListPage', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  afterEach(cleanup)

  it('renders case rows, details links, team, checklist progress and next actions', () => {
    render(
      <CasesListPage
        {...createPageProps({
          casesCount: 2,
          cases: [
            createCase(),
            createCase({
              id: 'case-2',
              title: 'A very long case title that remains readable as a row link',
              clientName: 'Cliente sem equipe',
              publicCode: 'CASO-0002',
              team: [],
              displayTeam: '',
              progress: undefined,
              nextAction: undefined,
            }),
          ],
        })}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Meus casos' })).toBeDefined()
    expect(screen.getByText('2 casos disponíveis para sua equipe')).toBeDefined()
    expect(screen.getByRole('columnheader', { name: 'Checklist' })).toBeDefined()
    expect(screen.getByRole('columnheader', { name: 'Equipe' })).toBeDefined()

    const caseLink = screen.getByRole('link', { name: /Revisão contratual/ })
    expect(caseLink.getAttribute('href')).toBe('/lawyerCaseDetails/case-1')
    expect(caseLink.getAttribute('data-route')).toBe('lawyerCaseDetails')
    expect(screen.getByText('2/7')).toBeDefined()
    expect(
      screen.getByText('Advogado de desenvolvimento', { selector: '.sr-only' }),
    ).toBeDefined()
    expect(screen.getByText('Revisar checklist de documentos')).toBeDefined()

    const secondRow = screen
      .getByRole('link', { name: /A very long case title/ })
      .closest('tr')
    expect(secondRow).not.toBeNull()
    expect(within(secondRow as HTMLElement).getByText('Cliente sem equipe')).toBeDefined()
    expect(
      within(secondRow as HTMLElement).getByRole('img', {
        name: 'Progresso não informado',
      }),
    ).toBeDefined()
    expect(within(secondRow as HTMLElement).getAllByText('—')).toHaveLength(2)
  })

  it('forwards search, status and area filter changes and offers case creation', () => {
    const handleSearchChange = vi.fn()
    const handleStatusChange = vi.fn()
    const handleAreaChange = vi.fn()
    render(
      <CasesListPage
        {...createPageProps({
          search: 'contrato',
          showCreateCaseAction: true,
          handleSearchChange,
          handleStatusChange,
          handleAreaChange,
        })}
      />,
    )

    fireEvent.change(
      screen.getByPlaceholderText('Buscar por caso, cliente, código ou área jurídica...'),
      { target: { value: 'novo termo' } },
    )
    expect(handleSearchChange).toHaveBeenCalledWith('novo termo')
    expect(
      screen.getByPlaceholderText('Buscar por caso, cliente, código ou área jurídica...'),
    ).toHaveProperty('value', 'contrato')
    expect(
      screen.getByRole('link', { name: 'Abrir novo caso' }).getAttribute('href'),
    ).toBe('/lawyerCaseCreation/')

    const [statusTrigger, areaTrigger] = screen.getAllByRole('combobox')
    fireEvent.keyDown(statusTrigger, { key: 'Enter' })
    fireEvent.click(screen.getByRole('option', { name: 'Encerrado' }))
    fireEvent.keyDown(areaTrigger, { key: 'Enter' })
    fireEvent.click(screen.getByRole('option', { name: 'Trabalhista' }))

    expect(handleStatusChange).toHaveBeenCalledWith('closed')
    expect(handleAreaChange).toHaveBeenCalledWith('Trabalhista')
  })

  it('shows loading, empty and error states with a retry action', () => {
    const { rerender } = render(
      <CasesListPage {...createPageProps({ isLoadingCases: true, cases: [] })} />,
    )
    expect(screen.getByText('Carregando casos...')).toBeDefined()
    expect(screen.queryByRole('status')).toBeNull()

    rerender(
      <CasesListPage
        {...createPageProps({
          cases: [],
          emptyMessage: 'Nenhum caso corresponde à busca.',
        })}
      />,
    )
    expect(screen.getByRole('status').textContent).toBe(
      'Nenhum caso corresponde à busca.',
    )

    const refetchCases = vi.fn()
    rerender(
      <CasesListPage
        {...createPageProps({ cases: [], isCasesError: true, refetchCases })}
      />,
    )
    expect(screen.getByRole('alert').textContent).toBe(
      'Não foi possível carregar os casos.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(refetchCases).toHaveBeenCalledOnce()
  })

  it('paginates while disabling controls at the first and last pages', () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <CasesListPage
        {...createPageProps({
          pagination: { page: 1, totalPages: 3, onPageChange },
        })}
      />,
    )

    expect(screen.getByText('Página 1 de 3')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Anterior' })).toHaveProperty(
      'disabled',
      true,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(onPageChange).toHaveBeenCalledWith(2)

    rerender(
      <CasesListPage
        {...createPageProps({
          pagination: { page: 3, totalPages: 3, onPageChange },
        })}
      />,
    )
    expect(screen.getByRole('button', { name: 'Próxima' })).toHaveProperty(
      'disabled',
      true,
    )

    rerender(
      <CasesListPage
        {...createPageProps({
          pagination: { page: 1, totalPages: 1, onPageChange },
        })}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Próxima' })).toBeNull()
  })
})
