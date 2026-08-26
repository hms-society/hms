import type { Entity } from '#shared/domain/entities/entity'
import type { CaseChecklistGate, CaseDossierGate, LegalCaseStatus } from '../structures'

export type LegalCase = Entity & {
  publicCode: string
  clientId: string
  intakeId: string
  legalAreaId: string
  legalTopicId: string
  title: string
  status: LegalCaseStatus
  checklistGate: CaseChecklistGate
  dossierGate: CaseDossierGate
  openedAt: Date
  createdAt: Date
  updatedAt: Date
}

export type LegalCaseCreation = Omit<
  LegalCase,
  'checklistGate' | 'createdAt' | 'dossierGate' | 'id' | 'updatedAt'
>
