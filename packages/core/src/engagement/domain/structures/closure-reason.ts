export const ClosureReason = {
  LegallyInfeasible: 'legally_infeasible',
  ClientWithdrew: 'client_withdrew',
  NoContact: 'no_contact',
  OutOfScope: 'out_of_scope',
  Referred: 'referred',
  Other: 'other',
} as const

export type ClosureReason = (typeof ClosureReason)[keyof typeof ClosureReason]
