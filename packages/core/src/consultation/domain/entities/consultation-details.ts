import type { Appointment } from '../../../scheduling/domain/entities'
import type { Client, CollaboratorSummary } from '../../../identity/domain/entities'
import type { Intake } from '../../../intake/domain/entities'

import type { Consultation } from './consultation'

export type ConsultationDetails = Consultation & {
  intake?: Intake
  client?: Client
  responsible?: CollaboratorSummary
  assignedLawyer?: CollaboratorSummary
  appointment?: Appointment
}
