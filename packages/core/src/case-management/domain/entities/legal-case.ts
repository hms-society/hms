import type { Entity } from '#shared/domain/entities/entity'
import type { CaseChecklistGate } from '../structures/case-checklist-gate'
import type { CaseDossierGate } from '../structures/case-dossier-gate'
import type {
  LegalCaseLifecycleStatus,
  LegalCaseStatus,
  LegalCaseWorkflowStage,
} from '../structures/legal-case-status'

export type LegalCase = Entity & {
  publicCode: string
  clientId: string
  intakeId: string
  legalAreaId: string
  legalTopicId: string
  title: string
  description?: string | null
  /** @deprecated Use lifecycleStatus and workflowStage for the case state. */
  status: LegalCaseStatus
  lifecycleStatus: LegalCaseLifecycleStatus
  workflowStage?: LegalCaseWorkflowStage
  teamVersion?: number
  checklistCompletedAt?: Date
  checklistCompletedBy?: string
  checklistGate: CaseChecklistGate
  dossierGate: CaseDossierGate
  openedAt: Date
  createdAt: Date
  updatedAt: Date
}

export type LegalCaseCreation = Omit<
  LegalCase,
  'checklistGate' | 'createdAt' | 'dossierGate' | 'id' | 'status' | 'updatedAt'
>
