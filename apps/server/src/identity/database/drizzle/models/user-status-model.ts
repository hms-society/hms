import { pgEnum } from 'drizzle-orm/pg-core'

export const userStatusModel = pgEnum('user_status', ['invited', 'active', 'disabled'])
