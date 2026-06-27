export const Profile = {
  Admin: 'admin',
  Receptionist: 'receptionist',
  Lawyer: 'lawyer',
  Paralegal: 'paralegal',
  Intern: 'intern',
  Supervisor: 'supervisor',
  Finance: 'finance',
  Client: 'client',
  ThirdParty: 'third_party',
} as const

export type Profile = (typeof Profile)[keyof typeof Profile]
