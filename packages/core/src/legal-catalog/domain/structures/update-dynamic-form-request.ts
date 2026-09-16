import type { DynamicFormDefinitionDraft } from './dynamic-form-definition-draft'

export type UpdateDynamicFormRequest = DynamicFormDefinitionDraft & {
  dynamicFormId: string
  expectedVersion: number
  operationKey: string
  actorCollaboratorId: string
}
