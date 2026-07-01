import type {
  ClosureReason,
  ContactChannel,
  IntakeOrigin,
  IntakeStatus,
} from '../structures'

export type Intake = {
  id: string
  personId: string
  demandTypeId: string
  status: IntakeStatus
  origin: IntakeOrigin
  contactChannel: ContactChannel
  thirdPartyId?: string
  description?: string
  assignedLawyerId?: string
  closureReason?: ClosureReason
  closureJustification?: string
  entryAt: Date
  closedAt?: Date
  contractedAt?: Date
}
