export const FormalizationSignatureRecipientKind = {
  client: 'client',
  collaborator: 'collaborator',
} as const
export type FormalizationSignatureRecipientKind =
  (typeof FormalizationSignatureRecipientKind)[keyof typeof FormalizationSignatureRecipientKind]
