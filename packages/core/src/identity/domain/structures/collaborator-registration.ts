import type { LegalExpertise } from './legal-expertise'

type AdministrativeCollaboratorRegistration = {
  readonly email: string
  readonly professionalName: string
  readonly jobTitle?: string
  readonly profile: 'admin' | 'attendant' | 'client'
  readonly legalExpertises?: never
}

type LegalCollaboratorRegistration = {
  readonly email: string
  readonly professionalName: string
  readonly jobTitle?: string
  readonly profile: 'lawyer' | 'paralegal' | 'supervisor'
  readonly legalExpertises: readonly [LegalExpertise, ...LegalExpertise[]]
}

export type CollaboratorRegistration =
  | AdministrativeCollaboratorRegistration
  | LegalCollaboratorRegistration
