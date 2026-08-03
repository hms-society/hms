import type { ContactChannel } from './contact-channel'
import type { IntakeOrigin } from './intake-origin'
import type { IntakeStatus } from './intake-status'
import type {
  ClientListProjection,
  ResponsibleListProjection,
} from '../../../identity/domain/structures'

export type IntakeListItem = {
  readonly intakeId: string
  readonly displayId: string
  readonly createdAt: Date
  readonly client: ClientListProjection
  readonly responsible: ResponsibleListProjection
  readonly demandNotes?: string
  readonly origin: IntakeOrigin
  readonly contactChannel: ContactChannel
  readonly status: IntakeStatus
}
