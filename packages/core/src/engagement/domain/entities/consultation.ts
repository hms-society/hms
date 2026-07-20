import type { ConsultationChannel, ConsultationModality, FormField } from '../structures'

export type Consultation = {
  id: string
  intakeId: string
  scheduledFor: Date
  modality: ConsultationModality
  channel: ConsultationChannel
  assignedLawyerId: string
  schedulingAppointmentId?: string
  heldAt?: Date
  summary?: string
  formValues?: FormField[]
  documentsRequested?: string[]
}
