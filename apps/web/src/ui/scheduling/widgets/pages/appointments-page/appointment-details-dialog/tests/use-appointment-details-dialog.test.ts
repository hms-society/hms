import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useAppointmentDetailsQuery } from '@/ui/scheduling/hooks/use-appointment-details-query'
import { useAppointmentDetailsDialog } from '../use-appointment-details-dialog'

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(),
}))

vi.mock('@/ui/scheduling/hooks/use-appointment-details-query', () => ({
  useAppointmentDetailsQuery: vi.fn(),
}))

const currentCollaboratorMock = vi.mocked(useCurrentCollaboratorQuery)
const detailsQueryMock = vi.mocked(useAppointmentDetailsQuery)

describe('useAppointmentDetailsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    detailsQueryMock.mockImplementation(
      (appointmentId) =>
        ({
          data: appointmentId
            ? ({
                appointmentId: 'appointment-1',
                lawyerId: 'lawyer-1',
                consultationId: 'consultation-1',
                status: 'scheduled',
              } as never)
            : undefined,
        }) as never,
    )
  })

  it('allows an administrator to manage and open the consultation', () => {
    currentCollaboratorMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'admin-1',
        profile: CollaboratorProfile.Admin,
      } as never,
    } as never)

    const { result } = renderHook(() =>
      useAppointmentDetailsDialog(true, 'appointment-1'),
    )

    expect(result.current.canManageAppointments).toBe(true)
    expect(result.current.canOpenConsultation).toBe(true)
    expect(detailsQueryMock).toHaveBeenCalledWith('appointment-1')
  })

  it('only exposes consultation access to the responsible lawyer', () => {
    currentCollaboratorMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'lawyer-1',
        profile: CollaboratorProfile.Lawyer,
      } as never,
    } as never)

    const { result, rerender } = renderHook(
      ({ id }: { id?: string }) => useAppointmentDetailsDialog(true, id),
      { initialProps: { id: 'appointment-1' } as { id?: string } },
    )
    expect(result.current.canOpenConsultation).toBe(true)
    expect(result.current.canManageAppointments).toBe(false)

    rerender({ id: undefined })
    expect(detailsQueryMock).toHaveBeenLastCalledWith(undefined)
    expect(result.current.canOpenConsultation).toBe(false)
  })
})
