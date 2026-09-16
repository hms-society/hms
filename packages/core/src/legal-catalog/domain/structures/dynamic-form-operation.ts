import type { DynamicForm } from '../entities/dynamic-form'
import type { DynamicFormDefinitionDraft } from './dynamic-form-definition-draft'

type DynamicFormOperationCanonicalRequest =
  | {
      kind: 'duplicated'
      sourceDynamicFormId: string
      normalizedName: string
    }
  | {
      kind: 'created' | 'updated'
      definition: DynamicFormDefinitionDraft
    }

export type DynamicFormOperation = {
  readonly operationKey: string
  readonly action: 'duplicated' | 'created' | 'updated'
  readonly actorCollaboratorId: string
  readonly targetDynamicFormId: string
  readonly expectedVersion: number | null
  readonly canonicalRequest: DynamicFormOperationCanonicalRequest
  readonly result: DynamicForm
  readonly completedAt: Date
}
