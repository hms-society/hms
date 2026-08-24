import type { DynamicFormAnswerValue } from './dynamic-form-answer-value'

export type DynamicFormAnswer = {
  readonly fieldId: string
  readonly value: DynamicFormAnswerValue
}
