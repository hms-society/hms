import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useCalendarFilterOptions } from '@/ui/scheduling/hooks/use-calendar-filter-options'
import { useCalendarQuery } from '@/ui/scheduling/hooks/use-calendar-query'
import { useAppointmentsPage } from '../use-appointments-page'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
  useSearch: () => ({ view: 'week', date: '2026-09-24', event: 'all' }),
}))

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(),
}))

vi.mock('@/ui/scheduling/hooks/use-calendar-filter-options', () => ({
  useCalendarFilterOptions: vi.fn(),
}))

vi.mock('@/ui/scheduling/hooks/use-calendar-query', () => ({
  useCalendarQuery: vi.fn(),
}))

const currentCollaboratorMock = vi.mocked(useCurrentCollaboratorQuery)
const filterOptionsMock = vi.mocked(useCalendarFilterOptions)
const calendarQueryMock = vi.mocked(useCalendarQuery)

describe('useAppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentCollaboratorMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'attendant-1',
        profile: CollaboratorProfile.Attendant,
      } as never,
    } as never)
    filterOptionsMock.mockReturnValue({
      data: { items: [] },
      isPending: false,
    } as never)
    calendarQueryMock.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never)
  })

  it('maps period navigation and filter clearing back to URL search state', () => {
    const { result } = renderHook(() => useAppointmentsPage())

    act(() => result.current.handleMovePeriod(1))
    const moveSearch = navigateMock.mock.calls[0]?.[0].search
    expect(moveSearch({ view: 'week', date: '2026-09-24', event: 'all' })).toMatchObject({
      date: '2026-10-01',
    })

    act(() => result.current.handleClearFilters())
    const clearSearch = navigateMock.mock.calls[1]?.[0].search
    expect(
      clearSearch({ view: 'week', date: '2026-09-24', event: 'scheduled' }),
    ).toMatchObject({
      clientId: undefined,
      lawyerId: undefined,
      event: 'all',
    })
  })

  it('captures overflow trigger and exposes attendee write permissions', () => {
    const { result } = renderHook(() => useAppointmentsPage())
    const trigger = document.createElement('button')

    act(() => result.current.openOverflow('2026-09-24', trigger))
    expect(result.current.overflowDate).toBe('2026-09-24')
    expect(result.current.overflowTrigger).toBe(trigger)
    expect(result.current.canManageAppointments).toBe(true)

    act(() => result.current.closeOverflow())
    expect(result.current.overflowDate).toBeUndefined()
    expect(result.current.overflowTrigger).toBeNull()
  })

  it('captures and clears the appointment trigger for dialog focus recovery', () => {
    const { result } = renderHook(() => useAppointmentsPage())
    const trigger = document.createElement('button')

    act(() => result.current.openAppointment('appointment-1', trigger))
    expect(result.current.selectedAppointmentId).toBe('appointment-1')
    expect(result.current.appointmentTrigger).toBe(trigger)

    act(() => result.current.closeAppointment())
    expect(result.current.selectedAppointmentId).toBeUndefined()
    expect(result.current.appointmentTrigger).toBeNull()
  })
})
