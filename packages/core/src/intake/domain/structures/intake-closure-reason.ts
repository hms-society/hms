export const IntakeClosureReason = {
  OutOfScope: 'out_of_scope',
  LegallyUnviable: 'legally_unviable',
  ClientWithdrew: 'client_withdrew',
  UnableToContact: 'unable_to_contact',
  NoShow: 'no_show',
  Referred: 'referred',
  Other: 'other',
} as const

export type IntakeClosureReason =
  (typeof IntakeClosureReason)[keyof typeof IntakeClosureReason]
