import type { Consultation } from '../../consultation/domain/entities'
import type { Client, Collaborator } from '../../identity/domain/entities'
import type { Intake } from '../../intake/domain/entities'
import type { DynamicForm } from '../../shared/domain/entities'

export type FormalizationContext = {
  readonly intake: Intake
  readonly consultation: Consultation
  readonly client: Client
  readonly assignedLawyer: Collaborator
  readonly contractForm?: DynamicForm
}
