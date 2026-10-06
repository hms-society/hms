import type { CaseTaskReminderCreation } from './case-task-reminder-creation'
import type { CaseTaskSource, CaseTaskStatus, CaseTaskType } from '../structures'

export type CaseTaskCreation = {
  caseId: string
  type: CaseTaskType
  customType?: string
  description: string
  plannedDate: string
  plannedTime?: string
  status: CaseTaskStatus
  createdById: string
  source: CaseTaskSource
  completionNote?: string
  assigneeIds: readonly string[]
  reminders: readonly CaseTaskReminderCreation[]
  completedAt?: Date
  completedById?: string
  lastReminderAt?: Date
}
