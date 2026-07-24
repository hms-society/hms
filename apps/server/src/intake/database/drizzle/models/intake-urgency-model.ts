import { pgEnum } from 'drizzle-orm/pg-core'

export const intakeUrgencyModel = pgEnum('intake_urgency', ['normal', 'high', 'urgent'])
