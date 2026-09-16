import type { LegalArea, LegalTopic } from '../entities'
import type { DynamicForm } from '../entities/dynamic-form'

export type DynamicFormEditorDetails = {
  form: DynamicForm
  legalArea: LegalArea
  legalTopics: LegalTopic[]
}
