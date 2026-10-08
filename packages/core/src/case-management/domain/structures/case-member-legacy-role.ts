export const CaseMemberLegacyRole = {
  LeadLawyer: 'lead_lawyer',
  Lawyer: 'lawyer',
  Paralegal: 'paralegal',
  Supervisor: 'supervisor',
  Intern: 'intern',
} as const

export type CaseMemberLegacyRole =
  (typeof CaseMemberLegacyRole)[keyof typeof CaseMemberLegacyRole]
