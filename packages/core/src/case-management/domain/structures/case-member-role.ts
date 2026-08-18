export const CaseMemberRole = {
  LeadLawyer: 'lead_lawyer',
  Lawyer: 'lawyer',
  Paralegal: 'paralegal',
  Supervisor: 'supervisor',
} as const

export type CaseMemberRole = (typeof CaseMemberRole)[keyof typeof CaseMemberRole]
