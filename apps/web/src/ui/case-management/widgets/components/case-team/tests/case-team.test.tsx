import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { CaseTeam } from '..'
import { useCaseTeam } from '../use-case-team'

vi.mock('../use-case-team', () => ({ useCaseTeam: vi.fn() }))
vi.mock('@/ui/case-management/widgets/components/case-team-member-selector', () => ({
  CaseTeamMemberSelector: () => null,
}))
const useCaseTeamMock = vi.mocked(useCaseTeam)
afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  useCaseTeamMock.mockReturnValue({
    caseTeam: {
      status: 'documentation',
      total: 2,
      activeManagerCount: 1,
      canManage: true,
      requiresAdministrativeReason: true,
      members: [],
    },
    canManageTeam: true,
    isClosed: false,
    isLoadingCaseTeam: false,
    caseTeamError: null,
    handleBeginRemoval: vi.fn(),
    handleBeginRoleChange: vi.fn(),
    handleCloseSelector: vi.fn(),
    handleSelectCandidate: vi.fn(),
    handleConfirmMutation: vi.fn(),
    handleOpenSelector: vi.fn(),
    handlePendingMutationOpenChange: vi.fn(),
    handleReasonChange: vi.fn(),
    handleRetryCaseTeam: vi.fn(),
    hasVersionConflict: false,
    isMutationPending: false,
    isSelectorOpen: false,
    mutationError: null,
    pendingMutation: null,
    reason: '',
  } as never)
})

function setState(overrides: Partial<ReturnType<typeof useCaseTeam>>) {
  const previousState = useCaseTeamMock.getMockImplementation()?.('case-1')
  if (!previousState) throw new Error('CaseTeam mock state is required')
  useCaseTeamMock.mockReturnValue({ ...previousState, ...overrides })
}

describe('CaseTeam', () => {
  it('renders loading and delegates a failed team request retry', () => {
    setState({ isLoadingCaseTeam: true })
    const { rerender } = render(<CaseTeam caseId='case-1' />)
    expect(screen.getByText('Carregando…')).toBeDefined()
    setState({ isLoadingCaseTeam: false, caseTeamError: new Error('offline') })
    rerender(<CaseTeam caseId='case-1' />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(useCaseTeamMock('case-1').handleRetryCaseTeam).toHaveBeenCalledOnce()
  })

  it('renders manager actions and hides them for read-only Closed cases', () => {
    const { rerender } = render(<CaseTeam caseId='case-1' />)
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar colaborador' }))
    expect(useCaseTeamMock('case-1').handleOpenSelector).toHaveBeenCalledOnce()
    setState({ canManageTeam: false, isClosed: true })
    rerender(<CaseTeam caseId='case-1' />)
    expect(screen.queryByRole('button', { name: 'Adicionar colaborador' })).toBeNull()
    expect(screen.getByRole('status').textContent).toContain('somente para consulta')
  })

  it('renders the empty team state when the case team is unavailable', () => {
    setState({ caseTeam: undefined })

    render(<CaseTeam caseId='case-1' />)

    expect(screen.getByText('0 ativas')).toBeDefined()
    expect(screen.getByText('Nenhum integrante vigente foi encontrado.')).toBeDefined()
  })

  it('renders the role mutation dialog and delegates cancel and confirmation', () => {
    const handlePendingMutationOpenChange = vi.fn()
    const handleConfirmMutation = vi.fn()
    setState({
      caseTeam: undefined,
      pendingMutation: {
        kind: 'role',
        member: {
          membershipId: 'membership-1',
          collaboratorId: 'collaborator-1',
          professionalName: 'Beatriz Oliveira',
          email: 'beatriz@example.test',
          profile: 'supervisor',
          role: CaseMemberRole.Collaborator,
          assignedAt: new Date('2026-01-01T00:00:00.000Z'),
          isEligible: true,
        },
        role: CaseMemberRole.Manager,
      },
      handlePendingMutationOpenChange,
      handleConfirmMutation,
    })

    render(<CaseTeam caseId='case-1' />)

    expect(screen.getByRole('heading', { name: 'Alterar nível de acesso' })).toBeDefined()
    expect(screen.getByText('Novo nível: Gestor')).toBeDefined()
    expect(screen.queryByLabelText('Justificativa administrativa')).toBeNull()
    const cancelButtons = screen.getAllByRole('button', { name: 'Cancelar' })
    const mutationCancelButton = cancelButtons.at(-1)
    expect(mutationCancelButton).toBeDefined()
    if (mutationCancelButton) fireEvent.click(mutationCancelButton)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(handlePendingMutationOpenChange).toHaveBeenCalledWith(false)
    expect(handleConfirmMutation).toHaveBeenCalledOnce()
  })
})
