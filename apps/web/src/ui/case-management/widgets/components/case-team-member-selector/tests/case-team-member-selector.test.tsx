import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CaseTeamMemberSelector } from '..'
import { useCaseTeamMemberSelector } from '../use-case-team-member-selector'

vi.mock(
  '@/ui/case-management/widgets/components/case-team-member-selector/use-case-team-member-selector',
  () => ({
    useCaseTeamMemberSelector: vi.fn(),
  }),
)

const selector = vi.mocked(useCaseTeamMemberSelector)
afterEach(cleanup)

describe('CaseTeamMemberSelector', () => {
  beforeEach(() => {
    selector.mockReturnValue({
      allowedRoles: ['collaborator', 'manager'],
      caseTeamCandidates: {
        items: [
          {
            collaboratorId: 'c1',
            professionalName: 'Ana Advogada',
            email: 'ana@example.test',
            profile: 'lawyer',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
      caseTeamCandidatesError: null,
      getProfileLabel: () => 'Advogado',
      handleClearFilters: vi.fn(),
      handleCollaboratorSelect: vi.fn(),
      handleConfirmSelection: vi.fn(),
      handleNextPage: vi.fn(),
      handlePreviousPage: vi.fn(),
      handleProfileChange: vi.fn(),
      handleRoleChange: vi.fn(),
      handleSearchChange: vi.fn(),
      isLoadingCaseTeamCandidates: false,
      isSingleRole: false,
      page: 1,
      profile: 'all',
      refetchCaseTeamCandidates: vi.fn(),
      requiredProfile: undefined,
      role: 'collaborator',
      search: '',
      selectedCollaborator: null,
    } as never)
  })

  it('shows active candidates and confirms only after a candidate is selected', () => {
    render(
      <CaseTeamMemberSelector
        open
        caseId='case-1'
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByText('Ana Advogada')).toBeTruthy()
    expect(screen.getByText('1 colaboradores encontrados')).toBeTruthy()
    const teamRoleField = screen.getByRole('combobox', { name: 'Nível na equipe' })
    const collaboratorProfileField = screen.getByRole('combobox', { name: 'Perfil' })
    expect(
      teamRoleField.compareDocumentPosition(collaboratorProfileField) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    expect(
      screen
        .getByRole('button', { name: 'Selecionar colaborador' })
        .hasAttribute('disabled'),
    ).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /Ana Advogada/ }))
    expect(
      selector.mock.results.at(-1)?.value.handleCollaboratorSelect,
    ).toHaveBeenCalled()
  })

  it('marks a selected candidate and delegates confirmation', () => {
    const selectedCandidate = {
      collaboratorId: 'c1',
      professionalName: 'Ana Advogada',
      email: 'ana@example.test',
      profile: 'lawyer',
    }
    const handleConfirmSelection = vi.fn()
    selector.mockReturnValueOnce({
      allowedRoles: ['collaborator', 'manager'],
      caseTeamCandidates: {
        items: [selectedCandidate],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
      caseTeamCandidatesError: null,
      getProfileLabel: () => 'Advogado',
      handleClearFilters: vi.fn(),
      handleCollaboratorSelect: vi.fn(),
      handleConfirmSelection,
      handleNextPage: vi.fn(),
      handlePreviousPage: vi.fn(),
      handleProfileChange: vi.fn(),
      handleRoleChange: vi.fn(),
      handleSearchChange: vi.fn(),
      isLoadingCaseTeamCandidates: false,
      isSingleRole: false,
      page: 1,
      profile: 'all',
      refetchCaseTeamCandidates: vi.fn(),
      requiredProfile: undefined,
      role: 'collaborator',
      search: '',
      selectedCollaborator: selectedCandidate,
    } as never)

    render(<CaseTeamMemberSelector open onClose={vi.fn()} onSelect={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: /Ana Advogada/ }).getAttribute('aria-pressed'),
    ).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar colaborador' }))
    expect(handleConfirmSelection).toHaveBeenCalledOnce()
  })

  it('exposes a retry action when candidate loading fails', () => {
    selector.mockReturnValueOnce({
      allowedRoles: ['collaborator', 'manager'],
      caseTeamCandidates: undefined,
      caseTeamCandidatesError: new Error('offline'),
      getProfileLabel: () => 'Advogado',
      handleClearFilters: vi.fn(),
      handleCollaboratorSelect: vi.fn(),
      handleConfirmSelection: vi.fn(),
      handleNextPage: vi.fn(),
      handlePreviousPage: vi.fn(),
      handleProfileChange: vi.fn(),
      handleRoleChange: vi.fn(),
      handleSearchChange: vi.fn(),
      isLoadingCaseTeamCandidates: false,
      isSingleRole: false,
      page: 1,
      profile: 'all',
      refetchCaseTeamCandidates: vi.fn(),
      requiredProfile: undefined,
      role: 'collaborator',
      search: '',
      selectedCollaborator: null,
    } as never)
    render(<CaseTeamMemberSelector open onClose={vi.fn()} onSelect={vi.fn()} />)
    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível buscar colaboradores.',
    )
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeTruthy()
  })

  it('hides the role selector for a single allowed role and shows candidate pagination', () => {
    selector.mockReturnValueOnce({
      allowedRoles: ['manager'],
      caseTeamCandidates: {
        items: [],
        page: 2,
        pageSize: 20,
        total: 41,
        totalPages: 3,
      },
      caseTeamCandidatesError: null,
      getProfileLabel: () => 'Advogado',
      handleClearFilters: vi.fn(),
      handleCollaboratorSelect: vi.fn(),
      handleConfirmSelection: vi.fn(),
      handleNextPage: vi.fn(),
      handlePreviousPage: vi.fn(),
      handleProfileChange: vi.fn(),
      handleRoleChange: vi.fn(),
      handleSearchChange: vi.fn(),
      isLoadingCaseTeamCandidates: false,
      isSingleRole: true,
      page: 2,
      profile: 'all',
      refetchCaseTeamCandidates: vi.fn(),
      requiredProfile: undefined,
      role: 'manager',
      search: '',
      selectedCollaborator: null,
    } as never)

    render(<CaseTeamMemberSelector open onClose={vi.fn()} onSelect={vi.fn()} />)
    expect(screen.queryByRole('combobox', { name: 'Nível na equipe' })).toBeNull()
    expect(screen.getByRole('combobox', { name: 'Perfil' })).toBeTruthy()
    expect(screen.getByText('Página 2 de 3')).toBeTruthy()
    expect(
      screen.getByText('Nenhum colaborador ativo encontrado para esses filtros.'),
    ).toBeTruthy()
  })

  it('shows loading status and closes from dialog dismissal', () => {
    const onClose = vi.fn()
    selector.mockReturnValueOnce({
      allowedRoles: ['collaborator', 'manager'],
      caseTeamCandidates: undefined,
      caseTeamCandidatesError: null,
      getProfileLabel: () => 'Advogado',
      handleClearFilters: vi.fn(),
      handleCollaboratorSelect: vi.fn(),
      handleConfirmSelection: vi.fn(),
      handleNextPage: vi.fn(),
      handlePreviousPage: vi.fn(),
      handleProfileChange: vi.fn(),
      handleRoleChange: vi.fn(),
      handleSearchChange: vi.fn(),
      isLoadingCaseTeamCandidates: true,
      isSingleRole: false,
      page: 1,
      profile: 'all',
      refetchCaseTeamCandidates: vi.fn(),
      requiredProfile: undefined,
      role: 'collaborator',
      search: '',
      selectedCollaborator: null,
    } as never)

    render(<CaseTeamMemberSelector open onClose={onClose} onSelect={vi.fn()} />)
    expect(screen.getByText('Buscando…')).toBeTruthy()
    expect(
      screen
        .getByRole('button', { name: 'Selecionar colaborador' })
        .hasAttribute('disabled'),
    ).toBe(true)
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0])
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('delegates search, retry, and dialog dismissal to the selector state', () => {
    const onClose = vi.fn()
    const handleSearchChange = vi.fn()
    const refetchCaseTeamCandidates = vi.fn()
    selector.mockReturnValueOnce({
      allowedRoles: ['collaborator', 'manager'],
      caseTeamCandidates: undefined,
      caseTeamCandidatesError: new Error('offline'),
      getProfileLabel: () => 'Advogado',
      handleClearFilters: vi.fn(),
      handleCollaboratorSelect: vi.fn(),
      handleConfirmSelection: vi.fn(),
      handleNextPage: vi.fn(),
      handlePreviousPage: vi.fn(),
      handleProfileChange: vi.fn(),
      handleRoleChange: vi.fn(),
      handleSearchChange,
      isLoadingCaseTeamCandidates: false,
      isSingleRole: false,
      page: 1,
      profile: 'all',
      refetchCaseTeamCandidates,
      requiredProfile: undefined,
      role: 'collaborator',
      search: '',
      selectedCollaborator: null,
    } as never)

    render(<CaseTeamMemberSelector open onClose={onClose} onSelect={vi.fn()} />)

    fireEvent.change(
      screen.getByRole('textbox', { name: 'Buscar colaborador por nome' }),
      {
        target: { value: 'Ana' },
      },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(handleSearchChange).toHaveBeenCalledWith('Ana')
    expect(refetchCaseTeamCandidates).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })
})
