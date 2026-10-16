import type { InferSelectModel } from 'drizzle-orm'

import { caseClosureEventModel } from '@/case-management/database/drizzle/models'

export type DrizzleCaseClosureEvent = InferSelectModel<typeof caseClosureEventModel>
