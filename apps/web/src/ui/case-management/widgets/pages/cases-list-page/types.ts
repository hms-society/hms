import type { IconName } from '@/ui/shared/widgets/components/icon'
import type { LegalCaseStatus } from '@hms/core/case-management/domain/structures'

export type CaseListPageItem = {
  id: string
  title: string
  clientName: string
  publicCode: string
  legalArea: string
  statusValue?: LegalCaseStatus
  status: string
  nextAction?: string
  updatedAt: string
  team: {
    collaboratorId: string
    initials: string
    name: string
    role: string
    className: string
  }[]
  progress?: {
    completedCount: number
    totalCount: number
    icon: IconName
  }
  displayTeam: string
  statusStyle: string
}

export type CaseDetailsRoute = 'lawyerCaseDetails' | 'adminCaseDetails'
