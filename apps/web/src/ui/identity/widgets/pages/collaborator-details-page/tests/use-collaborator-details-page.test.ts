import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MouseEvent } from 'react'
import { CollaboratorSummaryFaker } from '@hms/core/identity/domain/entities/fakers'
import { UserStatus } from '@hms/core/identity/domain/structures'
import { useCollaboratorDetailsQuery } from '@/ui/identity/hooks/use-collaborator-details-query'
import { useDeactivateCollaboratorAction } from '@/ui/identity/hooks/use-deactivate-collaborator-action'
import { useReactivateCollaboratorAction } from '@/ui/identity/hooks/use-reactivate-collaborator-action'
import { useCollaboratorDetailsPage } from '../use-collaborator-details-page'

vi.mock('@/ui/identity/hooks/use-collaborator-details-query', () => ({
  useCollaboratorDetailsQuery: vi.fn(),
}))
vi.mock('@/ui/identity/hooks/use-deactivate-collaborator-action', () => ({
  useDeactivateCollaboratorAction: vi.fn(),
}))
vi.mock('@/ui/identity/hooks/use-reactivate-collaborator-action', () => ({
  useReactivateCollaboratorAction: vi.fn(),
}))

const useCollaboratorDetailsQueryMock = vi.mocked(useCollaboratorDetailsQuery)
const useDeactivateCollaboratorActionMock = vi.mocked(useDeactivateCollaboratorAction)
const useReactivateCollaboratorActionMock = vi.mocked(useReactivateCollaboratorAction)

function confirmationEvent() {
  return { preventDefault: vi.fn() } as unknown as MouseEvent<HTMLButtonElement>
}

describe('useCollaboratorDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCollaboratorDetailsQueryMock.mockReturnValue({
      collaborator: CollaboratorSummaryFaker.legal(),
      collaboratorError: null,
      isLoadingCollaborator: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useCollaboratorDetailsQuery>)
    useDeactivateCollaboratorActionMock.mockReturnValue({
      deactivateCollaborator: vi.fn().mockResolvedValue(undefined),
      deactivateCollaboratorError: null,
      isDeactivatingCollaborator: false,
      resetDeactivateCollaborator: vi.fn(),
    })
    useReactivateCollaboratorActionMock.mockReturnValue({
      reactivateCollaborator: vi.fn().mockResolvedValue(undefined),
      reactivateCollaboratorError: null,
      isReactivatingCollaborator: false,
      resetReactivateCollaborator: vi.fn(),
    })
  })
  afterEach(cleanup)

  it('uses the Admin detail query and preserves legal expertise display mapping', () => {
    const collaborator = CollaboratorSummaryFaker.legal()
    useCollaboratorDetailsQueryMock.mockReturnValue({
      ...readMockResult(useCollaboratorDetailsQueryMock, 'target'),
      collaborator,
    })
    const { result } = renderHook(() =>
      useCollaboratorDetailsPage('selected-collaborator'),
    )
    expect(useCollaboratorDetailsQueryMock).toHaveBeenLastCalledWith(
      'selected-collaborator',
    )
    expect(result.current.collaborator).toEqual(collaborator)
    expect(result.current.getLegalExpertises(collaborator)).toEqual(
      collaborator.legalExpertises?.map(({ legalArea, legalTopics }) => ({
        areaName: legalArea.name,
        topicNames: legalTopics.map((topic) => topic.name),
      })),
    )
    expect(
      result.current.getLegalExpertises(
        CollaboratorSummaryFaker.fake({ profile: 'admin' }),
      ),
    ).toEqual([])
    expect(result.current.getProfileLabel('unknown-profile')).toBe('unknown-profile')
    expect(result.current.getStatusLabel('unknown-status')).toBe('unknown-status')
  })

  it.each(
    Object.values(UserStatus),
  )('maps %s account status to disabled state', (status) => {
    useCollaboratorDetailsQueryMock.mockReturnValue({
      ...readMockResult(useCollaboratorDetailsQueryMock, 'target'),
      collaborator: CollaboratorSummaryFaker.fake({ status }),
    })
    const { result } = renderHook(() => useCollaboratorDetailsPage('target'))
    expect(result.current.isCollaboratorDisabled).toBe(status === UserStatus.Disabled)
  })

  it('preserves loading, missing data, request failure and retry', () => {
    const error = new Error('Unavailable')
    const refetch = vi.fn()
    useCollaboratorDetailsQueryMock.mockReturnValue({
      collaborator: null,
      collaboratorError: error,
      isLoadingCollaborator: true,
      refetch,
    } as ReturnType<typeof useCollaboratorDetailsQuery>)
    const { result } = renderHook(() => useCollaboratorDetailsPage('target'))
    expect(result.current).toMatchObject({
      collaborator: null,
      collaboratorError: error,
      isLoadingCollaborator: true,
    })
    result.current.refetch()
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('opens, cancels and closes the edit dialog after successful editing', () => {
    const { result } = renderHook(() => useCollaboratorDetailsPage('target'))
    act(() => result.current.handleOpenEdit())
    expect(result.current.isEditDialogOpen).toBe(true)
    act(() => result.current.handleEditDialogOpenChange(false))
    expect(result.current.isEditDialogOpen).toBe(false)
    act(() => result.current.handleOpenEdit())
    act(() => result.current.handleEditSuccess())
    expect(result.current.isEditDialogOpen).toBe(false)
  })

  it.each([
    'deactivate',
    'reactivate',
  ] as const)('resets previous errors and closes %s confirmation on success', async (operation) => {
    const { result } = renderHook(() => useCollaboratorDetailsPage('target'))
    const isDeactivate = operation === 'deactivate'
    act(() =>
      isDeactivate
        ? result.current.handleOpenDeactivate()
        : result.current.handleOpenReactivate(),
    )
    expect(
      isDeactivate
        ? result.current.isDeactivateDialogOpen
        : result.current.isReactivateDialogOpen,
    ).toBe(true)
    const action = isDeactivate
      ? readMockResult(useDeactivateCollaboratorActionMock)
      : readMockResult(useReactivateCollaboratorActionMock)
    const reset =
      'resetDeactivateCollaborator' in action
        ? action.resetDeactivateCollaborator
        : action.resetReactivateCollaborator
    expect(reset).toHaveBeenCalledOnce()
    await act(async () => {
      await (isDeactivate
        ? result.current.handleConfirmDeactivate
        : result.current.handleConfirmReactivate)(confirmationEvent())
    })
    expect(
      isDeactivate
        ? result.current.isDeactivateDialogOpen
        : result.current.isReactivateDialogOpen,
    ).toBe(false)
    const submit =
      'deactivateCollaborator' in action
        ? action.deactivateCollaborator
        : action.reactivateCollaborator
    expect(submit).toHaveBeenCalledWith('target')
  })

  it.each([
    'deactivate',
    'reactivate',
  ] as const)('keeps %s failures open for retry and prevents duplicate submission while pending', async (operation) => {
    const isDeactivate = operation === 'deactivate'
    const error = new Error('Conflict')
    const submit = vi.fn().mockRejectedValue(error)
    if (isDeactivate)
      useDeactivateCollaboratorActionMock.mockReturnValue({
        ...readMockResult(useDeactivateCollaboratorActionMock),
        deactivateCollaborator: submit,
        deactivateCollaboratorError: error,
      })
    else
      useReactivateCollaboratorActionMock.mockReturnValue({
        ...readMockResult(useReactivateCollaboratorActionMock),
        reactivateCollaborator: submit,
        reactivateCollaboratorError: error,
      })
    const { result, rerender } = renderHook(() => useCollaboratorDetailsPage('target'))
    act(() =>
      isDeactivate
        ? result.current.handleOpenDeactivate()
        : result.current.handleOpenReactivate(),
    )
    await act(async () => {
      await (isDeactivate
        ? result.current.handleConfirmDeactivate
        : result.current.handleConfirmReactivate)(confirmationEvent())
    })
    expect(
      isDeactivate
        ? result.current.isDeactivateDialogOpen
        : result.current.isReactivateDialogOpen,
    ).toBe(true)
    expect(
      isDeactivate
        ? result.current.deactivateCollaboratorError
        : result.current.reactivateCollaboratorError,
    ).toBe(error)
    if (isDeactivate)
      useDeactivateCollaboratorActionMock.mockReturnValue({
        ...readMockResult(useDeactivateCollaboratorActionMock),
        isDeactivatingCollaborator: true,
      })
    else
      useReactivateCollaboratorActionMock.mockReturnValue({
        ...readMockResult(useReactivateCollaboratorActionMock),
        isReactivatingCollaborator: true,
      })
    rerender()
    act(() =>
      isDeactivate
        ? result.current.handleDeactivateDialogOpenChange(false)
        : result.current.handleReactivateDialogOpenChange(false),
    )
    await act(async () => {
      await (isDeactivate
        ? result.current.handleConfirmDeactivate
        : result.current.handleConfirmReactivate)(confirmationEvent())
    })
    expect(submit).toHaveBeenCalledOnce()
    expect(
      isDeactivate
        ? result.current.isDeactivateDialogOpen
        : result.current.isReactivateDialogOpen,
    ).toBe(true)
  })
})

function readMockResult<Arguments extends unknown[], Result>(
  hookMock: { getMockImplementation: () => ((...args: Arguments) => Result) | undefined },
  ...args: Arguments
): Result {
  const implementation = hookMock.getMockImplementation()
  if (!implementation) throw new Error('Mock return value was not configured')
  return implementation(...args)
}
