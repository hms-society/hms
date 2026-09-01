import type { InferSelectModel } from 'drizzle-orm'

import { caseChecklistItemModel } from '@/case-management/database/drizzle/models'

export type DrizzleCaseChecklistItem = InferSelectModel<typeof caseChecklistItemModel>
