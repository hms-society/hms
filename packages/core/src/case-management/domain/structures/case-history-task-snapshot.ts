import type { CaseTaskType } from './case-task-type'
import type { CaseTaskStatus } from './case-task-status'
export type CaseHistoryTaskSnapshot = {
  readonly taskId: string
  readonly version: number
  readonly type: CaseTaskType
  readonly title: string
  readonly description: string
  readonly customType?: string
  readonly reminders: readonly {
    readonly value: number
    readonly unit: 'minutes' | 'hours' | 'days'
  }[]
  readonly completedAt?: string
  readonly completedById?: string
  readonly plannedDate: string
  readonly plannedTime?: string
  readonly status: CaseTaskStatus
  readonly assigneeIds: readonly string[]
  readonly blocksCaseClosure: boolean
  readonly completionNote?: string
  readonly deletedAt?: string
}
