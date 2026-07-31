import { act, renderHook } from '@testing-library/react'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'

import { UserStatus } from '@hms/core/identity/domain/structures'

import { useCollaboratorActions } from '../../../../hooks/use-collaborator-actions'
import {
  useCollaboratorJobTitlesQuery,
  useCollaboratorsQuery,
} from '../use-collaborators-query'
import type { CollaboratorAction } from '../use-collaborators-page'
import { useCollaboratorsPage } from '../use-collaborators-page'

vi.mock('../use-collaborators-query', () => ({
  useCollaboratorJobTitlesQuery: vi.fn(),
  useCollaboratorsQuery: vi.fn(),
}))

vi.mock('../../../../hooks/use-collaborator-actions', () => ({
  useCollaboratorActions: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}))

const useCollaboratorActionsMock = vi.mocked(useCollaboratorActions)
const useCollaboratorJobTitlesQueryMock = vi.mocked(useCollaboratorJobTitlesQuery)
const useCollaboratorsQueryMock = vi.mocked(useCollaboratorsQuery)

type CollaboratorActions = ReturnType<typeof useCollaboratorActions>

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
    useCollaboratorActionsMock.mockReturnValue(createCollaboratorActions())
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
    useCollaboratorActionsMock.mockReturnValue(
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
    useCollaboratorActionsMock.mockReturnValue(
      createCollaboratorActions({ deactivateCollaborator }),
    )
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
    useCollaboratorActionsMock.mockReturnValue(actions)
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
    useCollaboratorActionsMock.mockReturnValue(
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
