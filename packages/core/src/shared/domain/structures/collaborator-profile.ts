export const CollaboratorProfile = {
  Admin: 'admin',
  Attendant: 'attendant',
  Lawyer: 'lawyer',
  Paralegal: 'paralegal',
  Supervisor: 'supervisor',
  Client: 'client',
  Intern: 'intern',
} as const

export type CollaboratorProfile =
  (typeof CollaboratorProfile)[keyof typeof CollaboratorProfile]
