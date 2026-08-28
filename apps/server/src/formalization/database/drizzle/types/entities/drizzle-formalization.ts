import type { InferSelectModel } from 'drizzle-orm'

import { formalizationModel } from '@/formalization/database/drizzle/models'

export type DrizzleFormalization = InferSelectModel<typeof formalizationModel>
