import { pgEnum } from 'drizzle-orm/pg-core'

export const thirdPartyPermissionModel = pgEnum('third_party_permission', [
  'view_intake_status',
  'view_case_status',
])
