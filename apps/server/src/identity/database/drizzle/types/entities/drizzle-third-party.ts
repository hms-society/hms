import type { InferSelectModel } from 'drizzle-orm'

import { thirdPartyModel } from '@/identity/database/drizzle/models'

export type DrizzleThirdParty = InferSelectModel<typeof thirdPartyModel>
