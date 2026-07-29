import { pgEnum } from 'drizzle-orm/pg-core'

export const clientTypeModel = pgEnum('client_type', ['natural', 'legal'])
