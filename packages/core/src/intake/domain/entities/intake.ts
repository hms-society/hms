import type { Entity } from '#shared/domain/entities/entity'
import type {
  ContactChannel,
  IntakeClosureReason,
  IntakeOrigin,
  IntakeStatus,
  IntakeUrgency,
} from '../structures'

export type Intake = Entity & {
  sequenceNumber: number
  clientId: string
  responsibleId: string
  createdBy: string
  updatedBy: string
  origin: IntakeOrigin
  contactChannel: ContactChannel
  legalAreaId: string
  legalTopicId: string
  urgency: IntakeUrgency
  demandNotes?: string
  status: IntakeStatus
  closureReason?: IntakeClosureReason
  closureNotes?: string
  closedAt?: Date
  version: number
  createdAt: Date
  updatedAt: Date
}

export type IntakeCreation = Omit<
  Intake,
  'createdAt' | 'id' | 'sequenceNumber' | 'updatedAt' | 'version'
>

export type IntakeUpdate = Partial<
  Pick<
    Intake,
    | 'clientId'
    | 'closureNotes'
    | 'closureReason'
    | 'closedAt'
    | 'contactChannel'
    | 'demandNotes'
    | 'legalAreaId'
    | 'legalTopicId'
    | 'origin'
    | 'responsibleId'
    | 'status'
    | 'updatedBy'
    | 'urgency'
  >
>
