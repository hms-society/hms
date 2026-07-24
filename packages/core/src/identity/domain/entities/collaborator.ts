import type { LegalExpertise } from '../structures'

type CollaboratorBase = {
  id: string
  userId: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type AdministrativeCollaborator = CollaboratorBase & {
  profile: 'admin' | 'attendant'
  legalExpertise?: never
}

type LegalCollaborator = CollaboratorBase & {
  profile: 'lawyer' | 'paralegal' | 'supervisor'
  legalExpertise: LegalExpertise
}

export type Collaborator = AdministrativeCollaborator | LegalCollaborator
