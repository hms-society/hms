export const FormalizationContractFormState = {
  Open: 'open',
  Closed: 'closed',
} as const

export type FormalizationContractFormState =
  (typeof FormalizationContractFormState)[keyof typeof FormalizationContractFormState]
