import type { InferSelectModel } from 'drizzle-orm'

import { thirdPartyPermissionGrantModel } from '@/identity/database/drizzle/models'

export type DrizzleThirdPartyPermissionGrant = InferSelectModel<
  typeof thirdPartyPermissionGrantModel
>
