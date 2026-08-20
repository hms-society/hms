import { useConsultationAttendanceActions } from './use-consultation-attendance-actions'
import { useConsultationCompletionAction } from './use-consultation-completion-action'
import { useConsultationQuery } from './use-consultation-query'
import { useConsultationStatusActions } from './use-consultation-status-actions'

export function useConsultation(consultationId?: string) {
  const consultationQuery = useConsultationQuery(consultationId)
  const statusActions = useConsultationStatusActions()
  const completionAction = useConsultationCompletionAction(consultationId)
  const attendanceActions = useConsultationAttendanceActions(consultationId)

  return {
    ...consultationQuery,
    ...statusActions,
    ...completionAction,
    ...attendanceActions,
  }
}
