import { pgEnum } from 'drizzle-orm/pg-core'

export const collaboratorProfileModel = pgEnum('collaborator_profile', [
  'admin',
  'attendant',
  'lawyer',
  'paralegal',
  'supervisor',
  'client',
])
