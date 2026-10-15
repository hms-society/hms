import type { InferSelectModel } from 'drizzle-orm'

import { caseTaskModel } from '@/case-management/database/drizzle/models'

export type DrizzleCaseTask = InferSelectModel<typeof caseTaskModel>
