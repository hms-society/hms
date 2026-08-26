export type DynamicFormFieldValidation = {
  readonly min?: number
  readonly max?: number
  readonly scale?: number
  readonly requiredWhen?: {
    readonly fieldKey: string
    readonly equals: string | boolean | number
  }
}
