import type { DynamicFormStage } from './dynamic-form-stage'
import type { DynamicFormStatus } from './dynamic-form-status'

export type DynamicFormListItem = {
  id: string
  name: string
  description: string | null
  status: DynamicFormStatus
  stage: DynamicFormStage
  legalArea: { id: string; name: string }
  legalTopics: Array<{ id: string; name: string; position: number }>
  fieldCount: number
}
