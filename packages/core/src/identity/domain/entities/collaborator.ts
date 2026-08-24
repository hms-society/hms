import type { LegalExpertise } from '../structures'
import type { Entity } from '../../../shared/domain/entities/entity'

type CollaboratorBase = Entity & {
  userId: string
  professionalName: string
  jobTitle?: string
  createdAt: Date
  updatedAt: Date
}

type AdministrativeCollaborator = CollaboratorBase & {
  profile: 'admin' | 'attendant' | 'client'
  legalExpertises?: never
}

type LegalCollaborator = CollaboratorBase & {
  profile: 'lawyer' | 'paralegal' | 'supervisor'
  legalExpertises: [LegalExpertise, ...LegalExpertise[]]
}

export type Collaborator = AdministrativeCollaborator | LegalCollaborator
