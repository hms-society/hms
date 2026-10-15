import type { CollaboratorLegalExpertiseProjection } from '../entities/collaborator-legal-expertise-projection'
import type { CollaboratorProfile } from './collaborator-profile'

export type CollaboratorProfessionalProfile = {
  readonly collaboratorId: string
  readonly professionalName: string
  readonly email: string
  readonly profile: CollaboratorProfile
  readonly legalExpertises: readonly CollaboratorLegalExpertiseProjection[]
}
