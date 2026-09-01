import type { IconName } from '@/ui/shared/widgets/components/icon'

export type ChecklistItemStatus = 'validado' | 'solicitado' | 'nao_solicitado'

export type ChecklistItem = {
  id: string
  isRequired?: boolean
  title: string
  status: ChecklistItemStatus
  statusLabel?: string
  subtitle?: string
  pendencies?: number
  documentFileId?: string
  documentName?: string
}

export type ActivityItem = {
  id: string
  icon: IconName
  title: string
  description: string
}

export type CaseTask = {
  title: string
  description: string
  assignee: string
  status: string
  icon: IconName
}

export type CaseTimelineItem = {
  icon: IconName
  title: string
  description: string
}

export type CaseTeamMember = {
  initials: string
  name: string
  role: string
  className: string
}

export type CaseStage = {
  icon: IconName
  label: string
  status?: string
  isActive?: boolean
}
