import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useSchedule } from '../use-scheduling'
import { useConsultation } from '../use-schedule'

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))
vi.mock('../use-scheduling', () => ({ useSchedule: vi.fn() }))

const useCurrentCollaboratorQueryMock = vi.mocked(useCurrentCollaboratorQuery)
const useRestContextMock = vi.mocked(useRestContext)
const useScheduleMock = vi.mocked(useSchedule)

describe('useConsultation', () => {
  const schedulingService = {
    createSchedule: vi.fn(),
    updateDuration: vi.fn(),
    updateAvailability: vi.fn(),
    addBlock: vi.fn(),
    removeBlock: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useCurrentCollaboratorQueryMock.mockReturnValue({
      currentCollaborator: { collaboratorId: 'collaborator-1' },
      currentCollaboratorError: null,
      isLoadingCurrentCollaborator: false,
    } as unknown as ReturnType<typeof useCurrentCollaboratorQuery>)
    useRestContextMock.mockReturnValue({
      schedulingService,
    } as unknown as ReturnType<typeof useRestContext>)
    useScheduleMock.mockReturnValue({
      schedule: { id: 'schedule-1' },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    schedulingService.updateDuration.mockResolvedValue(new RestResponse({ body: {} }))
    schedulingService.updateAvailability.mockResolvedValue(new RestResponse({ body: {} }))
    schedulingService.addBlock.mockResolvedValue(new RestResponse({ body: {} }))
    schedulingService.removeBlock.mockResolvedValue(new RestResponse({ body: {} }))
    schedulingService.createSchedule.mockResolvedValue(
      new RestResponse({ body: { id: 'created-schedule' } }),
    )
  })

  it('updates duration, availability, adds a block, and removes a block for an existing schedule', async () => {
    const { result } = renderHook(() => useConsultation(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.updateDuration(60)
      await result.current.updateAvailability([{ id: 'monday', active: true }])
      await result.current.addBlock({
        startDate: '2026-10-02',
        endDate: '',
        reason: 'Férias',
      })
      await result.current.removeBlock('block-1')
    })

    expect(schedulingService.updateDuration).toHaveBeenCalledWith('schedule-1', 60)
    expect(schedulingService.updateAvailability).toHaveBeenCalledWith({
      scheduleId: 'schedule-1',
      weeklyAvailability: [{ id: 'monday', active: true }],
    })
    expect(schedulingService.addBlock).toHaveBeenCalledWith({
      scheduleId: 'schedule-1',
      startsOn: '2026-10-02',
      endsOn: '2026-10-02',
      reason: 'Férias',
    })
    expect(schedulingService.removeBlock).toHaveBeenCalledWith('block-1')
  })

  it('creates a schedule before updating it when no schedule ID exists', async () => {
    useScheduleMock.mockReturnValue({
      schedule: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    const { result } = renderHook(() => useConsultation(), { wrapper: createWrapper() })

    await act(async () => result.current.updateDuration(30))

    expect(schedulingService.createSchedule).toHaveBeenCalledWith({
      collaboratorId: 'collaborator-1',
      defaultDurationMinutes: 45,
      weeklyAvailability: [],
    })
    expect(schedulingService.updateDuration).toHaveBeenCalledWith('created-schedule', 30)
  })

  it('rejects mutations without a collaborator or block ID', async () => {
    useCurrentCollaboratorQueryMock.mockReturnValue({
      currentCollaborator: undefined,
      currentCollaboratorError: null,
      isLoadingCurrentCollaborator: false,
    } as unknown as ReturnType<typeof useCurrentCollaboratorQuery>)
    const { result, rerender } = renderHook(() => useConsultation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await expect(result.current.updateDuration(45)).rejects.toThrow(
        'Current collaborator is required',
      )
      await expect(result.current.removeBlock('')).rejects.toThrow(
        'Blocked period ID is required',
      )
    })
    expect(schedulingService.updateDuration).not.toHaveBeenCalled()

    useCurrentCollaboratorQueryMock.mockReturnValue({
      currentCollaborator: { collaboratorId: 'collaborator-1' },
      currentCollaboratorError: null,
      isLoadingCurrentCollaborator: false,
    } as unknown as ReturnType<typeof useCurrentCollaboratorQuery>)
    useScheduleMock.mockReturnValue({
      schedule: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    rerender()
    schedulingService.createSchedule.mockResolvedValueOnce(new RestResponse({ body: {} }))
    await act(async () => {
      await expect(result.current.updateDuration(45)).rejects.toThrow(
        'Unable to obtain or create a schedule for the collaborator',
      )
    })
  })

  it('surfaces failed service responses', async () => {
    const { result } = renderHook(() => useConsultation(), { wrapper: createWrapper() })
    schedulingService.updateAvailability.mockResolvedValueOnce(
      new RestResponse({ statusCode: 500, errorMessage: 'update failed' }),
    )

    await act(async () => {
      await expect(result.current.updateAvailability([])).rejects.toThrow('update failed')
    })
    await waitFor(() => expect(result.current.isUpdatingAvailability).toBe(false))
  })
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
