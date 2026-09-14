import type { DynamicFormStage } from './dynamic-form-stage'
import type { DynamicFormStatus } from './dynamic-form-status'

export type DynamicFormListQuery = {
  search?: string
  stage?: DynamicFormStage
  status?: DynamicFormStatus
  page: number
  pageSize: 5
}
