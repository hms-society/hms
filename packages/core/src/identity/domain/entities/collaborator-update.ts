import type { LegalExpertise } from '../structures'

type AdministrativeCollaboratorUpdate = {
  readonly professionalName: string
  readonly jobTitle?: string
  readonly profile: 'admin' | 'attendant' | 'client'
  readonly legalExpertises?: never
}

type LegalCollaboratorUpdate = {
  readonly professionalName: string
  readonly jobTitle?: string
  readonly profile: 'lawyer' | 'paralegal' | 'supervisor'
  readonly legalExpertises: readonly [LegalExpertise, ...LegalExpertise[]]
}

export type CollaboratorUpdate =
  | AdministrativeCollaboratorUpdate
  | LegalCollaboratorUpdate
