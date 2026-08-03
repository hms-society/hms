import type { LegalExpertise } from '../structures'

type CollaboratorBase = {
  readonly id: string
  readonly userId: string
  readonly professionalName: string
  readonly jobTitle?: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

type AdministrativeCollaborator = CollaboratorBase & {
  readonly profile: 'admin' | 'attendant'
  readonly legalExpertises?: never
}

type LegalCollaborator = CollaboratorBase & {
  readonly profile: 'lawyer' | 'paralegal' | 'supervisor'
  readonly legalExpertises: readonly [LegalExpertise, ...LegalExpertise[]]
}

export type Collaborator = AdministrativeCollaborator | LegalCollaborator
