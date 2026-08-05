import type { ContactChannel } from './contact-channel'
import type { IntakeOrigin } from './intake-origin'
import type { IntakeStatus } from './intake-status'

export type IntakeListRow = {
  readonly intakeId: string
  readonly sequenceNumber: number
  readonly clientId: string
  readonly responsibleId: string
  readonly origin: IntakeOrigin
  readonly contactChannel: ContactChannel
  readonly demandNotes?: string
  readonly status: IntakeStatus
  readonly createdAt: Date
}
