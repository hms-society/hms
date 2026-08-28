import { useConsultationAttendanceActions } from './use-consultation-attendance-action'
import { useConsultationCompletionAction } from './use-consultation-completion-action'
import { useConsultationQuery } from './use-consultation-query'
import { useConsultationStatusActions } from './use-consultation-status-action'

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
