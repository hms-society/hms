import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppointmentActions } from '@/ui/scheduling/hooks/use-appointment-actions'
import { useCancelAppointmentDialog } from '../use-cancel-appointment-dialog'

vi.mock('@/ui/scheduling/hooks/use-appointment-actions', () => ({
  useAppointmentActions: vi.fn(),
}))

const actionsMock = vi.mocked(useAppointmentActions)

const detail = {
  appointmentId: 'appointment-1',
  updatedAt: '2026-09-20T12:00:00.000Z',
} as never

describe('useCancelAppointmentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits exactly the appointment revision and reports success', async () => {
    const cancelAppointment = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    actionsMock.mockReturnValue({
      cancelAppointment,
      isCancelling: false,
    } as never)

    const { result } = renderHook(() => useCancelAppointmentDialog(detail, onSuccess))
    await result.current.handleConfirm()

    expect(cancelAppointment).toHaveBeenCalledOnce()
    expect(cancelAppointment).toHaveBeenCalledWith({
      appointmentId: 'appointment-1',
      expectedRevision: '2026-09-20T12:00:00.000Z',
    })
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('keeps the request error available for recovery', async () => {
    actionsMock.mockReturnValue({
      cancelAppointment: vi.fn().mockRejectedValue(new Error('Revisão obsoleta')),
      isCancelling: false,
    } as never)

    const { result } = renderHook(() => useCancelAppointmentDialog(detail, vi.fn()))
    await result.current.handleConfirm()

    await waitFor(() => expect(result.current.error?.message).toBe('Revisão obsoleta'))
  })
})
