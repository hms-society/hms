import type { InferSelectModel } from 'drizzle-orm'

import { legalCaseModel } from '@/case-management/database/drizzle/models'

export type DrizzleLegalCase = InferSelectModel<typeof legalCaseModel>
