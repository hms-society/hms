import type { ContactChannel } from './contact-channel'
import type { IntakeOrigin } from './intake-origin'
import type { IntakeUrgency } from './intake-urgency'

export type IntakeDemandDraft = {
  readonly origin: IntakeOrigin
  readonly contactChannel: ContactChannel
  readonly legalArea: string
  readonly legalTopic: string
  readonly urgency: IntakeUrgency
  readonly notes?: string
}
