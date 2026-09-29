import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useAppointmentDetailsQuery } from '@/ui/scheduling/hooks/use-appointment-details-query'

export function useAppointmentDetailsDialog(open: boolean, appointmentId?: string) {
  const detailsQuery = useAppointmentDetailsQuery(open ? appointmentId : undefined)
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const isAdmin = currentCollaborator?.profile === CollaboratorProfile.Admin
  const isResponsibleLawyer =
    currentCollaborator?.profile === CollaboratorProfile.Lawyer &&
    detailsQuery.data?.lawyerId === currentCollaborator.collaboratorId

  return {
    ...detailsQuery,
    details: detailsQuery.data,
    canOpenConsultation: Boolean(
      detailsQuery.data?.consultationId && (isAdmin || isResponsibleLawyer),
    ),
    canManageAppointments:
      currentCollaborator?.profile === CollaboratorProfile.Admin ||
      currentCollaborator?.profile === CollaboratorProfile.Attendant,
  }
}
