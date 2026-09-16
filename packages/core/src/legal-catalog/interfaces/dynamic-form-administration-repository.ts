import type { DynamicForm } from '../domain/entities/dynamic-form'
import type { DynamicFormDefinitionField } from '../domain/entities/dynamic-form-definition-field'
import type { DynamicFormListQuery } from '../domain/structures/dynamic-form-list-query'
import type { DynamicFormListResult } from '../domain/structures/dynamic-form-list-result'
import type { DynamicFormReplaceResult } from '../domain/structures/dynamic-form-replace-result'
import type { DynamicFormStage } from '../domain/structures/dynamic-form-stage'
import type { DynamicFormStatus } from '../domain/structures/dynamic-form-status'

export interface DynamicFormAdministrationRepository {
  list(query: DynamicFormListQuery): Promise<DynamicFormListResult>
  findById(id: string): Promise<DynamicForm | null>
  findByNormalizedName(normalizedName: string): Promise<DynamicForm | null>
  add(form: DynamicForm): Promise<void>
  replace(
    dynamicFormId: string,
    changes: {
      name: string
      normalizedName: string
      description: string | null
      stage: DynamicFormStage
      legalAreaId: string
      legalTopicIds: string[]
      fields: DynamicFormDefinitionField[]
      updatedAt: Date
    },
    expectedVersion: number,
  ): Promise<DynamicFormReplaceResult>
  changeStatus(input: {
    id: string
    status: DynamicFormStatus
    updatedAt: Date
  }): Promise<DynamicForm | null>
  remove(id: string): Promise<boolean>
}
