import { pgEnum } from 'drizzle-orm/pg-core'

export const intakeOriginModel = pgEnum('intake_origin', [
  'direct',
  'referral',
  'website',
  'social_media',
  'other',
])
