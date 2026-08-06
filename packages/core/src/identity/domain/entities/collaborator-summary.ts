import type { CollaboratorProfile, UserStatus } from '../structures'
import type { CollaboratorLegalExpertiseProjection } from './collaborator-legal-expertise-projection'

type CollaboratorSummaryBase = {
  readonly collaboratorId: string
  readonly professionalName: string
  readonly email: string
  readonly profile: CollaboratorProfile
  readonly jobTitle?: string
  readonly status: UserStatus
  readonly lastAccessAt?: Date
}

type AdministrativeCollaboratorSummary = CollaboratorSummaryBase & {
  readonly profile: 'admin' | 'attendant' | 'client'
  readonly legalExpertises?: never
}

type LegalCollaboratorSummary = CollaboratorSummaryBase & {
  readonly profile: 'lawyer' | 'paralegal' | 'supervisor'
  readonly legalExpertises: readonly CollaboratorLegalExpertiseProjection[]
}

export type CollaboratorSummary =
  | AdministrativeCollaboratorSummary
  | LegalCollaboratorSummary
