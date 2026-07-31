import type { LegalExpertise } from '../structures'

type AdministrativeCollaboratorCreation = {
  readonly userId: string
  readonly professionalName: string
  readonly jobTitle?: string
  readonly profile: 'admin' | 'attendant'
  readonly legalExpertises?: never
}

type LegalCollaboratorCreation = {
  readonly userId: string
  readonly professionalName: string
  readonly jobTitle?: string
  readonly profile: 'lawyer' | 'paralegal' | 'supervisor'
  readonly legalExpertises: readonly [LegalExpertise, ...LegalExpertise[]]
}

export type CollaboratorCreation =
  | AdministrativeCollaboratorCreation
  | LegalCollaboratorCreation
