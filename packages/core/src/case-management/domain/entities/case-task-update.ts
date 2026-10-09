import type { CaseTaskReminderCreation } from './case-task-reminder-creation'
import type { CaseTaskStatus, CaseTaskType } from '../structures'

export type CaseTaskUpdate = {
  title?: string
  type?: CaseTaskType
  customType?: string | null
  description?: string
  plannedDate?: string
  plannedTime?: string | null
  status?: CaseTaskStatus
  completionNote?: string | null
  completedAt?: Date | null
  completedById?: string | null
  assigneeIds?: readonly string[]
  reminders?: readonly CaseTaskReminderCreation[]
  blocksCaseClosure?: boolean
  lastReminderAt?: Date | null
}
