import type { DynamicFormField } from '../entities/dynamic-form-field'

export type DynamicFormSnapshot = {
  readonly dynamicFormId: string
  readonly name: string
  readonly description?: string
  readonly fields: readonly DynamicFormField[]
}
