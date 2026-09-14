import type { DynamicForm } from '../domain/entities/dynamic-form'
import type { DynamicFormListQuery } from '../domain/structures/dynamic-form-list-query'
import type { DynamicFormListResult } from '../domain/structures/dynamic-form-list-result'
import type { DynamicFormStatus } from '../domain/structures/dynamic-form-status'

export interface DynamicFormAdministrationRepository {
  list(query: DynamicFormListQuery): Promise<DynamicFormListResult>
  findById(id: string): Promise<DynamicForm | null>
  findByNormalizedName(normalizedName: string): Promise<DynamicForm | null>
  add(form: DynamicForm): Promise<void>
  changeStatus(input: {
    id: string
    status: DynamicFormStatus
    updatedAt: Date
  }): Promise<DynamicForm | null>
  remove(id: string): Promise<boolean>
}
