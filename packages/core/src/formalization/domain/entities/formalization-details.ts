import type { Consultation } from '../../../consultation/domain/entities'
import type { Client, Collaborator } from '../../../identity/domain/entities'
import type { Intake } from '../../../intake/domain/entities'
import type { Formalization } from './formalization'

export type FormalizationDetails = {
  readonly formalization: Formalization
  readonly intake: Intake
  readonly consultation: Consultation
  readonly client: Client
  readonly assignedLawyer: Collaborator
}
