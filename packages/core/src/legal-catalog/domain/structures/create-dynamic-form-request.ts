import type { DynamicFormDefinitionDraft } from './dynamic-form-definition-draft'

export type CreateDynamicFormRequest = DynamicFormDefinitionDraft & {
  operationKey: string
  actorCollaboratorId: string
}
