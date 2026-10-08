import type { Entity } from '#shared/domain/entities/entity'
import type { CaseChecklistGate, CaseDossierGate, LegalCaseStatus } from '../structures'
import type { LegalCaseTeamMemberSummary } from './legal-case-team-member-summary'

export type LegalCaseSummary = Pick<Entity, 'id'> & {
  intakeId: string
  publicCode: string
  title: string
  status: LegalCaseStatus
  teamVersion: number
  clientName: string
  legalArea: string
  legalTopic: string
  openedAt: Date
  updatedAt: Date
  checklistGate: CaseChecklistGate
  dossierGate: CaseDossierGate
  team: LegalCaseTeamMemberSummary[]
}
