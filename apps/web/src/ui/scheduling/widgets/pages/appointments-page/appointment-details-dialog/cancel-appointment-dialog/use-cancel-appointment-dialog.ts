import { useState } from 'react'

import { useAppointmentActions } from '@/ui/scheduling/hooks/use-appointment-actions'
import type { AppointmentDetailsView } from '@/ui/scheduling/types'

export function useCancelAppointmentDialog(
  detail: AppointmentDetailsView | undefined,
  onSuccess: () => void,
) {
  const actions = useAppointmentActions()
  const [error, setError] = useState<Error | null>(null)

  async function handleConfirm() {
    if (!detail) return
    setError(null)
    try {
      await actions.cancelAppointment({
        appointmentId: detail.appointmentId,
        expectedRevision: detail.updatedAt,
      })
      onSuccess()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError
          : new Error('Não foi possível cancelar o agendamento.'),
      )
    }
  }

  return {
    handleConfirm,
    isCancelling: actions.isCancelling,
    error,
  }
}
