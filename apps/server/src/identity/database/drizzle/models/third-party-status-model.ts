import { pgEnum } from 'drizzle-orm/pg-core'

export const thirdPartyStatusModel = pgEnum('third_party_status', ['active', 'inactive'])
