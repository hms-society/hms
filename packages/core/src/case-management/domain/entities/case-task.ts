import type { Entity } from '#shared/domain/entities/entity'
import type { CaseTaskReminder } from './case-task-reminder'
import type { CaseTaskSource, CaseTaskStatus, CaseTaskType } from '../structures'

export type CaseTask = Entity & {
  caseId: string
  type: CaseTaskType
  title: string
  customType?: string
  description: string
  plannedDate: string
  plannedTime?: string
  status: CaseTaskStatus
  createdAt: Date
  createdById: string
  updatedAt: Date
  completedAt?: Date
  completedById?: string
  deletedAt?: Date
  version: number
  source: CaseTaskSource
  blocksCaseClosure: boolean
  completionNote?: string
  lastReminderAt?: Date
  assigneeIds: readonly string[]
  reminders: readonly CaseTaskReminder[]
}
