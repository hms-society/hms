import type { InferSelectModel } from 'drizzle-orm'

import { clientConsentModel } from '@/identity/database/drizzle/models'

export type DrizzleClientConsent = InferSelectModel<typeof clientConsentModel>
