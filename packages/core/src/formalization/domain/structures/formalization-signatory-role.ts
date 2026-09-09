export const FormalizationSignatoryRole = {
  Client: 'client',
  ResponsibleLawyer: 'responsible_lawyer',
  AdditionalCollaborator: 'additional_collaborator',
} as const

export type FormalizationSignatoryRole =
  (typeof FormalizationSignatoryRole)[keyof typeof FormalizationSignatoryRole]
