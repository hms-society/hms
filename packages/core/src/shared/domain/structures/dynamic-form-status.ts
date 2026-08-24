export const DynamicFormStatus = {
  Available: 'available',
  Unavailable: 'unavailable',
} as const

export type DynamicFormStatus = (typeof DynamicFormStatus)[keyof typeof DynamicFormStatus]
