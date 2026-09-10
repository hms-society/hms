export const FormalizationSignatureStatus = {
  InitializationRequired: 'initialization_required',
  Locked: 'locked',
  PreparingConfiguration: 'preparing_configuration',
  Configuring: 'configuring',
  ReadyForSending: 'ready_for_sending',
  ReadOnly: 'read_only',
} as const

export type FormalizationSignatureStatus =
  (typeof FormalizationSignatureStatus)[keyof typeof FormalizationSignatureStatus]
