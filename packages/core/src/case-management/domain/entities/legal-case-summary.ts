import type { Entity } from '#shared/domain/entities/entity'
import type { CaseChecklistGate, CaseDossierGate, LegalCaseStatus } from '../structures'
import type { CaseMemberRole } from '../structures/case-member-role'

export type LegalCaseTeamMemberSummary = {
  collaboratorId: string
  name: string
  role: CaseMemberRole
  isPrimary: boolean
}

export type LegalCaseSummary = Pick<Entity, 'id'> & {
  publicCode: string
  title: string
  status: LegalCaseStatus
  clientName: string
  legalArea: string
  legalTopic: string
  openedAt: Date
  updatedAt: Date
  version: number
  checklistGate: CaseChecklistGate
  dossierGate: CaseDossierGate
  team: LegalCaseTeamMemberSummary[]
}
