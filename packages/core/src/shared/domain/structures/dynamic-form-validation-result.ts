import type { DynamicFormAnswer } from './dynamic-form-answer'
import type { DynamicFormValidationIssue } from './dynamic-form-validation-issue'

export type DynamicFormValidationResult = {
  readonly answers: readonly DynamicFormAnswer[]
  readonly issues: readonly DynamicFormValidationIssue[]
}
