import type { DynamicForm } from '../entities/dynamic-form'

export type DuplicateDynamicFormOperation = {
  operationKey: string
  sourceDynamicFormId: string
  requestedNormalizedName: string
  actorCollaboratorId: string
  result: DynamicForm
  completedAt: Date
}
