import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppointmentActions } from '@/ui/scheduling/hooks/use-appointment-actions'
import { useRescheduleSlots } from '@/ui/scheduling/hooks/use-reschedule-slots'
import { useActiveCollaboratorsQuery } from '@/ui/identity/hooks/use-active-collaborators-query'
import { useRescheduleAppointmentDialog } from '../use-reschedule-appointment-dialog'

vi.mock('@/ui/scheduling/hooks/use-appointment-actions', () => ({
  useAppointmentActions: vi.fn(),
}))

vi.mock('@/ui/scheduling/hooks/use-reschedule-slots', () => ({
  useRescheduleSlots: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-active-collaborators-query', () => ({
  useActiveCollaboratorsQuery: vi.fn(),
}))

const actionsMock = vi.mocked(useAppointmentActions)
const slotsMock = vi.mocked(useRescheduleSlots)
const activeCollaboratorsMock = vi.mocked(useActiveCollaboratorsQuery)

const detail = {
  appointmentId: 'appointment-1',
  lawyerId: 'lawyer-1',
  lawyerName: 'Dra. Ana Silva',
  clientName: 'Mariana Costa',
  startsAt: '2026-09-24T12:00:00.000Z',
  endsAt: '2026-09-24T12:45:00.000Z',
  timeZone: 'America/Sao_Paulo',
  updatedAt: '2026-09-20T12:00:00.000Z',
} as never

describe('useRescheduleAppointmentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    slotsMock.mockReturnValue({
      data: [
        {
          startsAt: '2026-09-25T12:00:00.000Z',
          endsAt: '2026-09-25T12:45:00.000Z',
          timeZone: 'America/Sao_Paulo',
        },
      ],
      isPending: false,
      error: null,
    } as never)
    activeCollaboratorsMock.mockReturnValue({
      collaboratorsPage: {
        items: [
          {
            collaboratorId: 'lawyer-1',
            professionalName: 'Dra. Ana Silva',
            profile: 'lawyer',
            status: 'active',
            legalExpertises: [],
          },
        ],
      },
      collaboratorsPageError: null,
      isLoadingCollaborators: false,
      refetch: vi.fn(),
    } as never)
  })

  it('preserves the selected slot and submits the expected revision', async () => {
    const rescheduleAppointment = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    actionsMock.mockReturnValue({
      rescheduleAppointment,
      isRescheduling: false,
    } as never)

    const { result } = renderHook(() =>
      useRescheduleAppointmentDialog(true, detail, onSuccess),
    )
    act(() => result.current.setSelectedSlot('2026-09-25T12:00:00.000Z'))
    await result.current.handleConfirm()

    await waitFor(() => expect(rescheduleAppointment).toHaveBeenCalledOnce())
    expect(rescheduleAppointment).toHaveBeenCalledWith({
      appointmentId: 'appointment-1',
      expectedRevision: '2026-09-20T12:00:00.000Z',
      startsAt: '2026-09-25T12:00:00.000Z',
      lawyerId: 'lawyer-1',
    })
    expect(onSuccess).toHaveBeenCalledOnce()
  })
})
