import type { ContactChannel } from './contact-channel'
import type { IntakeListStatus } from './intake-list-status'
import type { IntakeOrigin } from './intake-origin'

export type IntakeListQuery = {
  readonly search?: string
  readonly status?: IntakeListStatus
  readonly clientIds?: readonly string[]
  readonly responsibleId?: string
  readonly origin?: IntakeOrigin
  readonly contactChannel?: ContactChannel
  readonly registeredFrom?: string
  readonly registeredTo?: string
  readonly page?: number
  readonly pageSize?: number
}
