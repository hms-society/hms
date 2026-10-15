import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CaseTeamRoster } from '..'
import { useCaseTeamRoster } from '../use-case-team-roster'

vi.mock(
  '@/ui/case-management/widgets/components/case-team/team-member-row/member-actions',
  () => ({
    MemberActions: ({
      canManage,
      onChangeRole,
      onRemove,
    }: {
      canManage: boolean
      onChangeRole: () => void
      onRemove: () => void
    }) =>
      canManage ? (
        <div>
          <button type='button' onClick={onChangeRole}>
            Alterar acesso
          </button>
          <button type='button' onClick={onRemove}>
            Remover colaborador
          </button>
        </div>
      ) : null,
  }),
)
vi.mock('@/ui/case-management/widgets/components/case-team-member-selector', () => ({
  CaseTeamMemberSelector: ({
    open,
    onSelect,
  }: {
    open: boolean
    onSelect: (candidate: never, role: never) => void
  }) =>
    open ? (
      <button
        type='button'
        onClick={() =>
          onSelect(
            { collaboratorId: 'collaborator-2', professionalName: 'Bia' } as never,
            'collaborator' as never,
          )
        }
      >
        Selecionar pessoa
      </button>
    ) : null,
}))
vi.mock('@/ui/case-management/widgets/components/case-team/team-mutation-dialog', () => ({
  TeamMutationDialog: ({
    mutation,
    onConfirm,
  }: {
    mutation: unknown
    onConfirm: () => void
  }) =>
    mutation ? (
      <button type='button' onClick={onConfirm}>
        Confirmar alteração
      </button>
    ) : null,
}))

vi.mock('../use-case-team-roster', () => ({ useCaseTeamRoster: vi.fn() }))

const useCaseTeamRosterMock = vi.mocked(useCaseTeamRoster)

afterEach(cleanup)

function createRosterState(overrides: Record<string, unknown> = {}) {
  return {
    canManageActiveTeam: false,
    caseTeam: {
      caseId: 'case-1',
      status: 'documentation',
      members: [],
      total: 1,
      canManage: false,
      activeManagerCount: 1,
      requiresAdministrativeReason: false,
    },
    error: null,
    handleBeginRemoval: vi.fn(),
    handleBeginRoleChange: vi.fn(),
    handleCloseSelector: vi.fn(),
    handleConfirmMutation: vi.fn(),
    handleOpenSelector: vi.fn(),
    handlePendingMutationOpenChange: vi.fn(),
    handleReasonChange: vi.fn(),
    handleRetry: vi.fn(),
    handleSelectCandidate: vi.fn(),
    hasVersionConflict: false,
    isLoading: false,
    isMutationPending: false,
    isSelectorOpen: false,
    members: [
      {
        membershipId: 'membership-1',
        collaboratorId: 'collaborator-1',
        professionalName: 'Beatriz Oliveira',
        email: 'beatriz@example.test',
        profile: 'lawyer',
        role: 'manager',
        assignedAt: new Date('2026-01-01T00:00:00.000Z'),
        isEligible: true,
      },
    ],
    mutationError: null,
    pendingMutation: null,
    reason: '',
    total: 1,
    ...overrides,
  } as never
}

beforeEach(() => {
  vi.clearAllMocks()
  useCaseTeamRosterMock.mockReturnValue(createRosterState())
})

describe('CaseTeamRoster', () => {
  it('shows active members, their role, and the read-only membership status', () => {
    render(<CaseTeamRoster caseId='case-1' />)

    expect(screen.getByRole('heading', { name: 'Equipe do caso' })).toBeDefined()
    expect(screen.getByText('1 integrante ativo')).toBeDefined()
    expect(screen.getByText('Beatriz Oliveira')).toBeDefined()
    expect(screen.getByText('beatriz@example.test')).toBeDefined()
    expect(screen.getByText('Gestor')).toBeDefined()
    expect(screen.getByText('Ativo')).toBeDefined()
    expect(
      screen.queryByRole('button', { name: /adicionar|remover|alterar/i }),
    ).toBeNull()
  })

  it('wires candidate selection and member role/removal actions for managers', () => {
    const handleOpenSelector = vi.fn()
    const handleSelectCandidate = vi.fn()
    const handleBeginRoleChange = vi.fn()
    const handleBeginRemoval = vi.fn()
    const handleConfirmMutation = vi.fn()
    useCaseTeamRosterMock.mockReturnValue(
      createRosterState({
        canManageActiveTeam: true,
        caseTeam: {
          caseId: 'case-1',
          status: 'documentation',
          members: [],
          total: 1,
          canManage: true,
          activeManagerCount: 2,
          requiresAdministrativeReason: false,
        },
        error: null,
        handleBeginRemoval,
        handleBeginRoleChange,
        handleCloseSelector: vi.fn(),
        handleConfirmMutation,
        handleOpenSelector,
        handlePendingMutationOpenChange: vi.fn(),
        handleReasonChange: vi.fn(),
        handleRetry: vi.fn(),
        handleSelectCandidate,
        hasVersionConflict: false,
        isLoading: false,
        isMutationPending: false,
        isSelectorOpen: true,
        members: [
          {
            membershipId: 'membership-1',
            collaboratorId: 'collaborator-1',
            professionalName: 'Beatriz Oliveira',
            email: 'beatriz@example.test',
            profile: 'lawyer',
            role: 'manager',
            assignedAt: new Date('2026-01-01T00:00:00.000Z'),
            isEligible: true,
          },
        ],
        mutationError: null,
        pendingMutation: {
          kind: 'role',
          member: { membershipId: 'membership-1' },
          role: 'collaborator',
        },
        reason: '',
        total: 1,
      }),
    )

    render(<CaseTeamRoster caseId='case-1' />)

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar colaborador' }))
    expect(handleOpenSelector).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar pessoa' }))
    expect(handleSelectCandidate).toHaveBeenCalledWith(
      { collaboratorId: 'collaborator-2', professionalName: 'Bia' },
      'collaborator',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Alterar acesso' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover colaborador' }))
    expect(handleBeginRoleChange).toHaveBeenCalledWith(
      expect.objectContaining({ membershipId: 'membership-1' }),
    )
    expect(handleBeginRemoval).toHaveBeenCalledWith(
      expect.objectContaining({ membershipId: 'membership-1' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar alteração' }))
    expect(handleConfirmMutation).toHaveBeenCalledOnce()
  })
})
