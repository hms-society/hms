import { act, renderHook } from '@testing-library/react'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'

import { UserStatus } from '@hms/core/identity/domain/structures'

import { useCancelCollaboratorInvitationAction } from '@/ui/identity/hooks/use-cancel-collaborator-invitation-action'
import { useDeactivateCollaboratorAction } from '@/ui/identity/hooks/use-deactivate-collaborator-action'
import { useCollaboratorJobTitlesQuery } from '@/ui/identity/hooks/use-collaborator-job-titles-query'
import { useCollaboratorsQuery } from '@/ui/identity/hooks/use-collaborators-query'
import { useReactivateCollaboratorAction } from '@/ui/identity/hooks/use-reactivate-collaborator-action'
import { useRemoveCollaboratorAction } from '@/ui/identity/hooks/use-remove-collaborator-action'
import { useResendCollaboratorInvitationAction } from '@/ui/identity/hooks/use-resend-collaborator-invitation-action'
import type { CollaboratorAction } from '../use-collaborators-page'
import { useCollaboratorsPage } from '../use-collaborators-page'

vi.mock('@/ui/identity/hooks/use-collaborator-job-titles-query', () => ({
  useCollaboratorJobTitlesQuery: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-collaborators-query', () => ({
  useCollaboratorsQuery: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-cancel-collaborator-invitation-action', () => ({
  useCancelCollaboratorInvitationAction: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-deactivate-collaborator-action', () => ({
  useDeactivateCollaboratorAction: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-reactivate-collaborator-action', () => ({
  useReactivateCollaboratorAction: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-remove-collaborator-action', () => ({
  useRemoveCollaboratorAction: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-resend-collaborator-invitation-action', () => ({
  useResendCollaboratorInvitationAction: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}))

const useCancelCollaboratorInvitationActionMock = vi.mocked(
  useCancelCollaboratorInvitationAction,
)
const useDeactivateCollaboratorActionMock = vi.mocked(useDeactivateCollaboratorAction)
const useCollaboratorJobTitlesQueryMock = vi.mocked(useCollaboratorJobTitlesQuery)
const useCollaboratorsQueryMock = vi.mocked(useCollaboratorsQuery)
const useReactivateCollaboratorActionMock = vi.mocked(useReactivateCollaboratorAction)
const useRemoveCollaboratorActionMock = vi.mocked(useRemoveCollaboratorAction)
const useResendCollaboratorInvitationActionMock = vi.mocked(
  useResendCollaboratorInvitationAction,
)

type CollaboratorActions = ReturnType<typeof useCancelCollaboratorInvitationAction> &
  ReturnType<typeof useDeactivateCollaboratorAction> &
  ReturnType<typeof useReactivateCollaboratorAction> &
  ReturnType<typeof useRemoveCollaboratorAction> &
  ReturnType<typeof useResendCollaboratorInvitationAction>

function createCollaboratorActions(
  overrides: Partial<CollaboratorActions> = {},
): CollaboratorActions {
  return {
    resendInvitation: vi.fn().mockResolvedValue(undefined),
    isResendingInvitation: false,
    resendInvitationError: null,
    resetResendInvitation: vi.fn(),
    deactivateCollaborator: vi.fn().mockResolvedValue(undefined),
    isDeactivatingCollaborator: false,
    deactivateCollaboratorError: null,
    resetDeactivateCollaborator: vi.fn(),
    reactivateCollaborator: vi.fn().mockResolvedValue(undefined),
    isReactivatingCollaborator: false,
    reactivateCollaboratorError: null,
    resetReactivateCollaborator: vi.fn(),
    cancelCollaboratorInvitation: vi.fn().mockResolvedValue(undefined),
    isCancellingCollaboratorInvitation: false,
    cancelCollaboratorInvitationError: null,
    resetCancelCollaboratorInvitation: vi.fn(),
    removeCollaborator: vi.fn().mockResolvedValue(undefined),
    isRemovingCollaborator: false,
    removeCollaboratorError: null,
    resetRemoveCollaborator: vi.fn(),
    ...overrides,
  }
}

function mockCollaboratorActions(actions: CollaboratorActions) {
  useCancelCollaboratorInvitationActionMock.mockReturnValue({
    cancelCollaboratorInvitation: actions.cancelCollaboratorInvitation,
    cancelCollaboratorInvitationError: actions.cancelCollaboratorInvitationError,
    isCancellingCollaboratorInvitation: actions.isCancellingCollaboratorInvitation,
    resetCancelCollaboratorInvitation: actions.resetCancelCollaboratorInvitation,
  })
  useDeactivateCollaboratorActionMock.mockReturnValue({
    deactivateCollaborator: actions.deactivateCollaborator,
    deactivateCollaboratorError: actions.deactivateCollaboratorError,
    isDeactivatingCollaborator: actions.isDeactivatingCollaborator,
    resetDeactivateCollaborator: actions.resetDeactivateCollaborator,
  })
  useReactivateCollaboratorActionMock.mockReturnValue({
    reactivateCollaborator: actions.reactivateCollaborator,
    reactivateCollaboratorError: actions.reactivateCollaboratorError,
    isReactivatingCollaborator: actions.isReactivatingCollaborator,
    resetReactivateCollaborator: actions.resetReactivateCollaborator,
  })
  useRemoveCollaboratorActionMock.mockReturnValue({
    removeCollaborator: actions.removeCollaborator,
    removeCollaboratorError: actions.removeCollaboratorError,
    isRemovingCollaborator: actions.isRemovingCollaborator,
    resetRemoveCollaborator: actions.resetRemoveCollaborator,
  })
  useResendCollaboratorInvitationActionMock.mockReturnValue({
    resendInvitation: actions.resendInvitation,
    resendInvitationError: actions.resendInvitationError,
    isResendingInvitation: actions.isResendingInvitation,
    resetResendInvitation: actions.resetResendInvitation,
  })
}

const collaborator = {
  collaboratorId: 'collaborator-id',
  professionalName: 'Ana Ribeiro',
  email: 'ana@example.com',
  profile: 'lawyer' as const,
  status: 'invited' as const,
  lastAccessAt: undefined,
  legalExpertises: [],
}

describe('useCollaboratorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCollaboratorActions(createCollaboratorActions())
    useCollaboratorJobTitlesQueryMock.mockReturnValue({
      jobTitles: ['Advogada'],
      jobTitlesError: null,
      isLoadingJobTitles: false,
    })
    useCollaboratorsQueryMock.mockReturnValue({
      collaboratorsPage: {
        items: [collaborator],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
      collaboratorsPageError: null,
      isLoadingCollaborators: false,
      refetch: vi.fn(),
    })
  })

  it('parses collaborator filters and pagination with nuqs defaults', () => {
    const { result } = renderHook(() => useCollaboratorsPage(), {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?search=Ana&profile=lawyer&status=active&page=2&pageSize=10',
      }),
    })

    expect(result.current.query).toEqual({
      search: 'Ana',
      profile: 'lawyer',
      jobTitle: undefined,
      status: UserStatus.Active,
      page: 2,
      pageSize: 10,
    })
  })

  it('updates filters and resets pagination through nuqs', async () => {
    const { result } = renderHook(() => useCollaboratorsPage(), {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?search=Ana&page=3&pageSize=10',
      }),
    })

    await act(async () => {
      await result.current.handleUpdateSearch({
        search: 'Maria',
        status: UserStatus.Disabled,
        page: 2,
      })
    })

    expect(result.current.query).toEqual({
      search: 'Maria',
      profile: undefined,
      jobTitle: undefined,
      status: UserStatus.Disabled,
      page: 2,
      pageSize: 10,
    })

    await act(async () => {
      await result.current.handleClearFilters()
    })

    expect(result.current.query).toEqual({
      search: undefined,
      profile: undefined,
      jobTitle: undefined,
      status: undefined,
      page: 1,
      pageSize: 20,
    })
  })

  it('builds the confirmation content for every collaborator action', () => {
    const { result } = renderHook(() => useCollaboratorsPage(), {
      wrapper: withNuqsTestingAdapter(),
    })
    const actions: Array<{
      kind: CollaboratorAction['kind']
      icon: 'mail' | 'refresh-cw' | 'x' | 'user-x'
      title: string
      buttonLabel: string
      isDestructive: boolean
      description: string
    }> = [
      {
        kind: 'resend',
        icon: 'mail',
        title: 'Reenviar convite?',
        buttonLabel: 'Reenviar convite',
        isDestructive: false,
        description: 'Um novo e-mail de acesso será enviado para este colaborador.',
      },
      {
        kind: 'deactivate',
        icon: 'user-x',
        title: 'Inativar colaborador?',
        buttonLabel: 'Inativar colaborador',
        isDestructive: true,
        description: 'Essa ação suspenderá o acesso de Ana Ribeiro à HMS.',
      },
      {
        kind: 'reactivate',
        icon: 'refresh-cw',
        title: 'Reativar colaborador?',
        buttonLabel: 'Reativar colaborador',
        isDestructive: false,
        description: 'O acesso de Ana Ribeiro à HMS será reativado.',
      },
      {
        kind: 'cancel-invitation',
        icon: 'x',
        title: 'Cancelar convite?',
        buttonLabel: 'Cancelar convite',
        isDestructive: true,
        description:
          'O convite de Ana Ribeiro será invalidado e a conta ficará disponível para remoção.',
      },
      {
        kind: 'remove',
        icon: 'user-x',
        title: 'Remover colaborador?',
        buttonLabel: 'Remover colaborador',
        isDestructive: true,
        description:
          'A conta de Ana Ribeiro e o convite cancelado serão removidos permanentemente.',
      },
    ]

    for (const expected of actions) {
      const action = { kind: expected.kind, collaborator }

      expect(result.current.getCollaboratorActionIcon(action)).toBe(expected.icon)
      expect(result.current.getCollaboratorActionTitle(action)).toBe(expected.title)
      expect(result.current.getCollaboratorActionButtonLabel(action)).toBe(
        expected.buttonLabel,
      )
      expect(result.current.getCollaboratorActionDescription(action)).toBe(
        expected.description,
      )
      expect(result.current.isDestructiveCollaboratorAction(action)).toBe(
        expected.isDestructive,
      )
    }

    expect(result.current.getCollaboratorActionDescription()).toBe('')
  })

  it('confirms a selected action through the matching mutation', async () => {
    const resendInvitation = vi.fn().mockResolvedValue(undefined)
    const resetResendInvitation = vi.fn()
    mockCollaboratorActions(
      createCollaboratorActions({ resendInvitation, resetResendInvitation }),
    )
    const { result } = renderHook(() => useCollaboratorsPage(), {
      wrapper: withNuqsTestingAdapter(),
    })

    act(() => result.current.handleOpenAction('resend', collaborator))
    await act(async () => {
      await result.current.handleConfirmAction({ preventDefault: vi.fn() } as never)
    })

    expect(resetResendInvitation).toHaveBeenCalledOnce()
    expect(resendInvitation).toHaveBeenCalledWith('collaborator-id')
    expect(result.current.selectedAction).toBeUndefined()
    expect(toast.success).toHaveBeenCalledWith('Convite reenviado com sucesso.')
  })

  it('does not open removal for a disabled collaborator', () => {
    const { result } = renderHook(() => useCollaboratorsPage(), {
      wrapper: withNuqsTestingAdapter(),
    })

    act(() =>
      result.current.handleOpenAction('remove', {
        ...collaborator,
        status: 'disabled',
        lastAccessAt: new Date('2026-07-29T15:30:00.000Z'),
      }),
    )

    expect(result.current.selectedAction).toBeUndefined()
  })

  it('shows a success toast after deactivating a collaborator', async () => {
    const deactivateCollaborator = vi.fn().mockResolvedValue(undefined)
    mockCollaboratorActions(createCollaboratorActions({ deactivateCollaborator }))
    const { result } = renderHook(() => useCollaboratorsPage(), {
      wrapper: withNuqsTestingAdapter(),
    })

    act(() => result.current.handleOpenAction('deactivate', collaborator))
    await act(async () => {
      await result.current.handleConfirmAction({ preventDefault: vi.fn() } as never)
    })

    expect(deactivateCollaborator).toHaveBeenCalledWith('collaborator-id')
    expect(toast.success).toHaveBeenCalledWith('Colaborador inativado com sucesso.')
  })

  it.each([
    {
      kind: 'reactivate' as const,
      mutation: 'reactivateCollaborator' as const,
      reset: 'resetReactivateCollaborator' as const,
      message: 'Colaborador reativado com sucesso.',
    },
    {
      kind: 'cancel-invitation' as const,
      mutation: 'cancelCollaboratorInvitation' as const,
      reset: 'resetCancelCollaboratorInvitation' as const,
      message: 'Convite cancelado com sucesso.',
    },
    {
      kind: 'remove' as const,
      mutation: 'removeCollaborator' as const,
      reset: 'resetRemoveCollaborator' as const,
      message: 'Colaborador removido com sucesso.',
    },
  ])('confirms the $kind action through its matching mutation', async (testCase) => {
    const mutation = vi.fn().mockResolvedValue(undefined)
    const reset = vi.fn()
    const actions = createCollaboratorActions()
    Object.assign(actions, { [testCase.mutation]: mutation, [testCase.reset]: reset })
    mockCollaboratorActions(actions)
    const selectedCollaborator =
      testCase.kind === 'remove'
        ? { ...collaborator, status: 'disabled' as const, lastAccessAt: undefined }
        : collaborator

    const { result } = renderHook(() => useCollaboratorsPage(), {
      wrapper: withNuqsTestingAdapter(),
    })

    act(() => result.current.handleOpenAction(testCase.kind, selectedCollaborator))
    await act(async () => {
      await result.current.handleConfirmAction({ preventDefault: vi.fn() } as never)
    })

    expect(reset).toHaveBeenCalledOnce()
    expect(mutation).toHaveBeenCalledWith('collaborator-id')
    expect(toast.success).toHaveBeenCalledWith(testCase.message)
  })

  it('does not confirm an action while another action is pending', async () => {
    const deactivateCollaborator = vi.fn().mockResolvedValue(undefined)
    mockCollaboratorActions(
      createCollaboratorActions({
        deactivateCollaborator,
        isDeactivatingCollaborator: true,
      }),
    )
    const { result } = renderHook(() => useCollaboratorsPage(), {
      wrapper: withNuqsTestingAdapter(),
    })

    act(() => result.current.handleOpenAction('deactivate', collaborator))
    await act(async () => {
      await result.current.handleConfirmAction({ preventDefault: vi.fn() } as never)
    })

    expect(deactivateCollaborator).not.toHaveBeenCalled()
    expect(result.current.selectedAction).toEqual({
      kind: 'deactivate',
      collaborator,
    })
  })

  it('shows a toast for a success message received from the route', () => {
    renderHook(
      () =>
        useCollaboratorsPage({
          successMessage: 'Convite pendente enviado com sucesso.',
        }),
      { wrapper: withNuqsTestingAdapter() },
    )

    expect(toast.success).toHaveBeenCalledWith('Convite pendente enviado com sucesso.')
  })
})
