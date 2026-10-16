import type {
  LegalCaseLifecycleStatus,
  LegalCaseStatus,
  LegalCaseWorkflowStage,
} from './legal-case-status'
import type { CaseTeamMember } from './case-team-member'

export type CaseTeam = {
  caseId: string
  publicCode: string
  status: LegalCaseStatus
  lifecycleStatus?: LegalCaseLifecycleStatus
  workflowStage?: LegalCaseWorkflowStage
  teamVersion: number
  members: CaseTeamMember[]
  total: number
  activeManagerCount: number
  canManage: boolean
  requiresAdministrativeReason: boolean
}
